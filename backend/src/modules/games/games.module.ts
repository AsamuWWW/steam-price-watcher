import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { SteamClient } from '../../common/steam/steam.client';

@Module({
  controllers: [GamesController],
  providers: [GamesService, SteamClient],
  exports: [GamesService, SteamClient],
})
export class GamesModule {}
