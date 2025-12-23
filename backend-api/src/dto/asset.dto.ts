import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsPositive,
  Min,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetType } from 'src/constants';

export class AssetDto {
  @ApiProperty({
    description: 'Type of the asset',
    enum: AssetType,
    example: AssetType.STOCK,
  })
  @IsEnum(AssetType)
  assetType: AssetType;

  @ApiProperty({
    description:
      'Code of the asset (e.g., 0700 for stocks, custom code for bonds/funds)',
    example: '0700',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Name of the asset',
    example: 'Tencent Holdings Limited',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Quantity of the asset',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Price per unit',
    example: 320.5,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    description: 'Date of purchase',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  purchaseDate: string;
}

export class UpdateAssetDto {
  @ApiPropertyOptional({
    description: 'Quantity of the asset',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Price per unit',
    example: 320.5,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  @Type(() => Number)
  price: number;
}
