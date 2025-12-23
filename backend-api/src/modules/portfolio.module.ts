import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioController } from '../controllers/portfolio.controller';
import { Portfolio } from '../entities/portfolio.entity';
import { Asset } from '../entities/asset.entity';
import { MarketService } from '../services/market.service';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';
import { TransactionService } from '../services/transaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([Portfolio, Asset, User, Transaction])],
  controllers: [PortfolioController],
  providers: [PortfolioService, MarketService, TransactionService],
})
export class PortfolioModule {}
