import {
  IsString,
  IsNumber,
  IsPositive,
  Min,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetType, TransactionType } from '../constants';

export class TransactionDto {
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsString()
  assetCode: string;

  @IsString()
  assetName: string;

  @IsEnum(AssetType)
  assetType: AssetType;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  @Type(() => Number)
  price: number;
}
