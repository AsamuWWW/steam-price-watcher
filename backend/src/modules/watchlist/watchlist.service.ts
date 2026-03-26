import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWatchDto } from './dto/create-watch.dto';
import { UpdateWatchDto } from './dto/update-watch.dto';

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.watch.findMany({
      include: {
        game: true,
        notifications: {
          where: { readAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateWatchDto, ip?: string) {
    // Upsert the game
    const game = await this.prisma.game.upsert({
      where: { steamAppId: dto.steamAppId },
      update: { name: dto.name },
      create: {
        steamAppId: dto.steamAppId,
        name: dto.name,
      },
    });

    const watch = await this.prisma.watch.create({
      data: {
        gameId: game.id,
        discountThreshold: dto.discountThreshold ?? 50,
        priceThresholdEnabled: dto.priceThresholdEnabled ?? false,
        priceThresholdCents: dto.priceThresholdCents ?? null,
      },
      include: { game: true },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'WATCH_CREATED',
        metaJson: JSON.stringify({ watchId: watch.id, steamAppId: dto.steamAppId, name: dto.name }),
        ip,
      },
    });

    return watch;
  }

  async update(id: number, dto: UpdateWatchDto, ip?: string) {
    const existing = await this.prisma.watch.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Watch ${id} not found`);

    const watch = await this.prisma.watch.update({
      where: { id },
      data: {
        ...(dto.enabled !== undefined && { enabled: dto.enabled }),
        ...(dto.discountThreshold !== undefined && { discountThreshold: dto.discountThreshold }),
        ...(dto.priceThresholdEnabled !== undefined && {
          priceThresholdEnabled: dto.priceThresholdEnabled,
        }),
        ...(dto.priceThresholdCents !== undefined && {
          priceThresholdCents: dto.priceThresholdCents,
        }),
      },
      include: { game: true },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'WATCH_UPDATED',
        metaJson: JSON.stringify({ watchId: id, changes: dto }),
        ip,
      },
    });

    return watch;
  }

  async remove(id: number, ip?: string) {
    const existing = await this.prisma.watch.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Watch ${id} not found`);

    await this.prisma.watch.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        action: 'WATCH_DELETED',
        metaJson: JSON.stringify({ watchId: id }),
        ip,
      },
    });
  }
}
