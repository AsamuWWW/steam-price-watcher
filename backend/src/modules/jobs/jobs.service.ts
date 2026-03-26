import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PricesService } from '../prices/prices.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricesService: PricesService,
  ) {}

  @Cron(process.env.DAILY_CRON || '0 3 * * *')
  async handleDailyPriceCheck() {
    await this.runDailyJob();
  }

  async runDailyJob() {
    this.logger.log('Starting daily price check job');
    const jobRun = await this.prisma.jobRun.create({
      data: {
        jobName: 'DAILY_PRICE_CHECK',
        status: 'RUNNING',
      },
    });

    try {
      const stats = await this.pricesService.fetchAllEnabledWatches();

      await this.prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          finishedAt: new Date(),
          status: stats.failed > 0 ? 'PARTIAL' : 'SUCCESS',
          statsJson: JSON.stringify(stats),
          error: stats.errors.length > 0 ? stats.errors.join('; ') : null,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          action: 'JOB_RUN',
          metaJson: JSON.stringify({ jobRunId: jobRun.id, stats }),
        },
      });

      this.logger.log(`Daily job completed: ${JSON.stringify(stats)}`);
      return stats;
    } catch (err) {
      await this.prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          finishedAt: new Date(),
          status: 'FAILED',
          error: err.message,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          action: 'JOB_ERROR',
          metaJson: JSON.stringify({ jobRunId: jobRun.id, error: err.message }),
        },
      });

      this.logger.error(`Daily job failed: ${err.message}`);
      throw err;
    }
  }
}
