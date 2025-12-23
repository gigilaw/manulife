import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Portfolio } from '../entities/portfolio.entity';
import { Asset } from '../entities/asset.entity';
import { AssetDto, UpdateAssetDto } from '../dto/asset.dto';
import { MarketService } from '../services/market.service';
import { TransactionService } from '../services/transaction.service';
import { TransactionType } from '../constants';
import { TransactionDto } from 'src/dto/transaction.dto';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepo: Repository<Portfolio>,

    @InjectRepository(Asset)
    private assetRepo: Repository<Asset>,

    private marketService: MarketService,
    private transactionService: TransactionService,
  ) {}

  async addAsset(
    tokenUserId: number,
    data: AssetDto,
    portfolioId: string,
  ): Promise<Asset> {
    await this.verifyPortfolioOwnership(tokenUserId, portfolioId);
    const asset = this.assetRepo.create({
      ...data,
      portfolio: { id: portfolioId },
    });

    await this.assetRepo.save(asset);

    const transaction: TransactionDto = {
      transactionType: TransactionType.BUY,
      assetCode: asset.code,
      assetName: asset.name,
      assetType: asset.assetType,
      quantity: asset.quantity,
      price: asset.price,
    };

    await this.transactionService.recordTransaction(tokenUserId, transaction);
    await this.refreshPortfolio(tokenUserId);

    return asset;
  }

  private async verifyPortfolioOwnership(
    tokenUserId: number,
    portfolioId: string,
  ): Promise<boolean> {
    const portfolio = await this.portfolioRepo.findOne({
      where: { id: portfolioId },
      relations: ['user'],
    });

    // Verify ownership
    if (portfolio && portfolio.user.id !== tokenUserId) {
      throw new ForbiddenException(
        'You do not have permission to access this portfolio',
      );
    }
    return true;
  }

  // Refresh all prices and calculate totals, mock real-time api
  async refreshPortfolio(tokenUserId: number): Promise<Portfolio> {
    const portfolio = await this.portfolioRepo.findOne({
      where: { user: { id: tokenUserId } },
      relations: ['assets'],
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio not found`);
    }

    let totalValue = 0;
    let totalCost = 0;
    const assetUpdates = portfolio.assets.map((asset) => {
      const currentPrice = this.marketService.getAssetPrice(asset.code);
      const currentValue = asset.quantity * currentPrice;
      const costBasis = asset.quantity * asset.price;
      const gainLoss = currentValue - costBasis;

      totalValue += currentValue;
      totalCost += costBasis;

      return {
        id: asset.id,
        currentPrice,
        currentValue,
        gainLossAmount: gainLoss,
        gainLossPercentage:
          costBasis > 0 ? +((gainLoss / costBasis) * 100).toFixed(2) : 0,
      };
    });

    // Batch update assets
    await Promise.all(
      assetUpdates.map((update) => this.assetRepo.update(update.id, update)),
    );

    // Update portfolio totals
    portfolio.totalValue = totalValue;
    portfolio.totalCost = totalCost;
    portfolio.totalGainLoss = totalValue - totalCost;

    portfolio.totalReturnPercentage =
      totalCost > 0
        ? +((portfolio.totalGainLoss / totalCost) * 100).toFixed(2)
        : 0;
    portfolio.updatedAt = new Date();

    return await this.portfolioRepo.save(portfolio);
  }

  // Get portfolio summary (refreshes prices automatically)
  async getDashboard(userId: number) {
    const portfolio = await this.refreshPortfolio(userId);
    const { transactions, totals } =
      await this.transactionService.getUserTransactionsInfo(userId);
    return {
      summary: {
        portfolioId: portfolio.id,
        totalValue: portfolio.totalValue,
        totalCost: portfolio.totalCost,
        totalGainLoss: portfolio.totalGainLoss,
        totalReturnPercentage: portfolio.totalReturnPercentage,
        lastUpdated: portfolio.updatedAt,
      },
      assets: portfolio.assets,
      transactions: {
        totalCount: totals.count,
        totalBuyAmount: totals.totalBuyAmount,
        totalSellAmount: totals.totalSellAmount,
        netFlow: totals.totalBuyAmount - totals.totalSellAmount,
        records: transactions,
      },
    };
  }

  // Update asset
  async updateAsset(
    tokenUserId: number,
    portfolioId: string,
    assetId: string,
    data: UpdateAssetDto,
  ): Promise<Asset> {
    const asset = await this.assetRepo.findOne({
      where: { id: assetId, portfolio: { id: portfolioId } },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    if (asset.quantity === data.quantity && asset.price === data.price) {
      throw new ForbiddenException('No changes detected in asset update');
    }

    if (data.quantity === 0) {
      await this.removeAsset(tokenUserId, portfolioId, asset);
    } else {
      await this.verifyPortfolioOwnership(tokenUserId, portfolioId);

      await this.assetRepo.update(
        { id: assetId, portfolio: { id: portfolioId } },
        {
          ...data,
          portfolio: { id: portfolioId },
        },
      );
    }

    if (asset.quantity !== data.quantity) {
      // Record transaction
      const transaction: TransactionDto = {
        transactionType:
          data.quantity > asset.quantity
            ? TransactionType.BUY
            : TransactionType.SELL,
        assetCode: asset.code,
        assetName: asset.name,
        assetType: asset.assetType,
        quantity: Math.abs(data.quantity - asset.quantity),
        price: data.price,
      };

      await this.transactionService.recordTransaction(tokenUserId, transaction);
    }

    await this.refreshPortfolio(tokenUserId);
    asset.quantity = data.quantity;
    asset.price = data.price;
    return asset;
  }

  // Remove (soft delete) asset
  async removeAsset(
    tokenUserId: number,
    portfolioId: string,
    assetOrId: Asset | string,
  ): Promise<void> {
    await this.verifyPortfolioOwnership(tokenUserId, portfolioId);
    let asset;

    if (typeof assetOrId === 'string') {
      asset = await this.assetRepo.findOne({
        where: { id: assetOrId, portfolio: { id: portfolioId } },
      });
      if (!asset) throw new NotFoundException('Asset not found');
    } else {
      asset = assetOrId;
    }

    await this.assetRepo.softRemove(asset);
  }
}
