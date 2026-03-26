import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { CreateWatchDto } from './dto/create-watch.dto';
import { UpdateWatchDto } from './dto/update-watch.dto';
import { Request } from 'express';

@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  async findAll() {
    const data = await this.watchlistService.findAll();
    return { ok: true, data, error: null };
  }

  @Post()
  async create(@Body() dto: CreateWatchDto, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress || '';
    const data = await this.watchlistService.create(dto, ip);
    return { ok: true, data, error: null };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWatchDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket?.remoteAddress || '';
    const data = await this.watchlistService.update(id, dto, ip);
    return { ok: true, data, error: null };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress || '';
    await this.watchlistService.remove(id, ip);
    return { ok: true, data: null, error: null };
  }
}
