import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioController } from '../controllers/portfolio.controller';
import { Portfolio } from '../entities/portfolio.entity';
import { Asset } from '../entities/asset.entity';
import { MarketService } from '../services/market.service';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Portfolio, Asset, User])],
  controllers: [PortfolioController],
  providers: [PortfolioService, MarketService],
})
export class PortfolioModule {}
