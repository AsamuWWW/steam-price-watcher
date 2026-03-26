import { Controller, Post, Get, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { PricesService } from './prices.service';
import { Request } from 'express';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Post('refresh/:watchId')
  async refresh(@Param('watchId', ParseIntPipe) watchId: number, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress || '';
    const data = await this.pricesService.refreshWatch(watchId, ip);
    return { ok: true, data, error: null };
  }

  @Get('history/:gameId')
  async history(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Query('days') days = '30',
  ) {
    const daysNum = parseInt(days) || 30;
    const data = await this.pricesService.getHistory(gameId, daysNum);
    return { ok: true, data, error: null };
  }
}
