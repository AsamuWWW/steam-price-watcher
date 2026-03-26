import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll() {
    const data = await this.notificationsService.findAll();
    return { ok: true, data, error: null };
  }

  @Post(':id/read')
  async markRead(@Param('id', ParseIntPipe) id: number) {
    const data = await this.notificationsService.markRead(id);
    return { ok: true, data, error: null };
  }
}
