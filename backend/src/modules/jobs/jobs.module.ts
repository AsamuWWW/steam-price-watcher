import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { PricesModule } from '../prices/prices.module';

@Module({
  imports: [PricesModule],
  providers: [JobsService],
})
export class JobsModule {}
