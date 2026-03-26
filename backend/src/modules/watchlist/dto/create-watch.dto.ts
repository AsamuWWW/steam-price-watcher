import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateWatchDto {
  @IsInt()
  steamAppId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

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
