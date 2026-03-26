import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.notification.findMany({
      include: {
        watch: {
          include: { game: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(id: number) {
    const existing = await this.prisma.notification.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Notification ${id} not found`);

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
}
