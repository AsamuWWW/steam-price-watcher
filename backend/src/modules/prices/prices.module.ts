import { Module } from '@nestjs/common';
import { PricesController } from './prices.controller';
import { PricesService } from './prices.service';
import { SteamClient } from '../../common/steam/steam.client';

@Module({
  controllers: [PricesController],
  providers: [PricesService, SteamClient],
  exports: [PricesService],
})
export class PricesModule {}
