import { IsBoolean, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateWatchDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountThreshold?: number;

  @IsOptional()
  @IsBoolean()
  priceThresholdEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceThresholdCents?: number;
}
