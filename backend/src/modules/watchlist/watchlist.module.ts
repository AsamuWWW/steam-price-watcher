import { Module } from '@nestjs/common';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { SteamClient } from '../../common/steam/steam.client';

@Module({
  controllers: [WatchlistController],
  providers: [WatchlistService, SteamClient],
  exports: [WatchlistService],
})
export class WatchlistModule {}
