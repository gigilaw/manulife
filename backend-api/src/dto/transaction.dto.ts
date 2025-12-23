import { IsString, IsNumber, IsPositive, Min, IsEnum } from 'class-validator';
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

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @IsPositive()
  @Min(0.01)
  @Type(() => Number)
  price: number;
}
