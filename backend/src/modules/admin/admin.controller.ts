import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminIpGuard } from '../../common/guards/admin-ip.guard';

@Controller('admin')
@UseGuards(AdminIpGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  async overview() {
    const data = await this.adminService.getOverview();
    return { ok: true, data, error: null };
  }

  @Post('trigger-daily')
  async triggerDaily() {
    const data = await this.adminService.triggerDaily();
    return { ok: true, data, error: null };
  }
}
