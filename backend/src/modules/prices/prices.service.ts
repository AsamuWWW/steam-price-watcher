import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SteamClient } from '../../common/steam/steam.client';

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly steamClient: SteamClient,
  ) {}

  async refreshWatch(watchId: number, ip?: string) {
    const watch = await this.prisma.watch.findUnique({
      where: { id: watchId },
      include: { game: true },
    });
    if (!watch) throw new NotFoundException(`Watch ${watchId} not found`);

    const priceInfo = await this.steamClient.getAppPrice(watch.game.steamAppId);

    const snapshot = await this.prisma.priceSnapshot.create({
      data: {
        gameId: watch.gameId,
        currency: priceInfo.currency || 'CNY',
        finalCents: priceInfo.finalCents,
        initialCents: priceInfo.initialCents,
        discountPercent: priceInfo.discountPercent,
        isFree: priceInfo.isFree,
        status: priceInfo.status,
      },
    });

    // Check trigger conditions
    await this.checkAndNotify(watch, priceInfo);

    await this.prisma.auditLog.create({
      data: {
        action: 'MANUAL_REFRESH',
        metaJson: JSON.stringify({ watchId, steamAppId: watch.game.steamAppId, priceInfo }),
        ip,
      },
    });

    return snapshot;
  }

  async checkAndNotify(watch: any, priceInfo: any) {
    if (priceInfo.status !== 'OK' && priceInfo.status !== 'FREE') return;

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check discount threshold
    if (watch.discountThreshold && priceInfo.discountPercent >= watch.discountThreshold) {
      const recentNotification = await this.prisma.notification.findFirst({
        where: {
          watchId: watch.id,
          type: 'DISCOUNT_REACHED',
          createdAt: { gte: yesterday },
        },
      });

      if (!recentNotification) {
        await this.prisma.notification.create({
          data: {
            watchId: watch.id,
            type: 'DISCOUNT_REACHED',
            message: `${watch.game.name} discount reached ${priceInfo.discountPercent}% (threshold: ${watch.discountThreshold}%)`,
          },
        });

        await this.prisma.auditLog.create({
          data: {
            action: 'NOTIFY_CREATED',
            metaJson: JSON.stringify({
              watchId: watch.id,
              type: 'DISCOUNT_REACHED',
              discountPercent: priceInfo.discountPercent,
            }),
          },
        });
      }
    }

    // Check price threshold
    if (
      watch.priceThresholdEnabled &&
      watch.priceThresholdCents &&
      priceInfo.finalCents > 0 &&
      priceInfo.finalCents <= watch.priceThresholdCents
    ) {
      const recentNotification = await this.prisma.notification.findFirst({
        where: {
          watchId: watch.id,
          type: 'PRICE_BELOW',
          createdAt: { gte: yesterday },
        },
      });

      if (!recentNotification) {
        await this.prisma.notification.create({
          data: {
            watchId: watch.id,
            type: 'PRICE_BELOW',
            message: `${watch.game.name} price dropped to ¥${(priceInfo.finalCents / 100).toFixed(2)} (threshold: ¥${(watch.priceThresholdCents / 100).toFixed(2)})`,
          },
        });

        await this.prisma.auditLog.create({
          data: {
            action: 'NOTIFY_CREATED',
            metaJson: JSON.stringify({
              watchId: watch.id,
              type: 'PRICE_BELOW',
              finalCents: priceInfo.finalCents,
              thresholdCents: watch.priceThresholdCents,
            }),
          },
        });
      }
    }
  }

  async getHistory(gameId: number, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.prisma.priceSnapshot.findMany({
      where: {
        gameId,
        fetchedAt: { gte: since },
      },
      orderBy: { fetchedAt: 'asc' },
    });
  }

  async fetchAllEnabledWatches(): Promise<{ success: number; failed: number; errors: string[] }> {
    const watches = await this.prisma.watch.findMany({
      where: { enabled: true },
      include: { game: true },
    });

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const watch of watches) {
      try {
        const priceInfo = await this.steamClient.getAppPrice(watch.game.steamAppId);

        await this.prisma.priceSnapshot.create({
          data: {
            gameId: watch.gameId,
            currency: priceInfo.currency || 'CNY',
            finalCents: priceInfo.finalCents,
            initialCents: priceInfo.initialCents,
            discountPercent: priceInfo.discountPercent,
            isFree: priceInfo.isFree,
            status: priceInfo.status,
          },
        });

        await this.checkAndNotify(watch, priceInfo);
        success++;
      } catch (err) {
        failed++;
        const errMsg = `Failed to fetch price for watch ${watch.id} (appid: ${watch.game.steamAppId}): ${err.message}`;
        errors.push(errMsg);
        this.logger.error(errMsg);

        // Create error notification
        await this.prisma.notification.create({
          data: {
            watchId: watch.id,
            type: 'ERROR',
            message: `Failed to fetch price: ${err.message}`,
          },
        });
      }
    }

    return { success, failed, errors };
  }
}
