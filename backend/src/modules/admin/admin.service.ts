import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [recentJobRuns, recentErrors, recentAuditLogs] = await Promise.all([
      this.prisma.jobRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),
      this.prisma.notification.findMany({
        where: { type: 'ERROR' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          watch: {
            include: { game: true },
          },
        },
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return {
      recentJobRuns,
      recentErrors,
      recentAuditLogs,
    };
  }

  async triggerDaily() {
    // This will be called by JobsService, but we expose it here for admin HTTP trigger
    return { triggered: true, timestamp: new Date().toISOString() };
  }
}
