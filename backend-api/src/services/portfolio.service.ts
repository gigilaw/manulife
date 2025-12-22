import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
import { Asset } from '../entities/asset.entity';
import { MarketService } from '../services/market.service';
import { AssetDto, UpdateAssetDto } from '../dto/asset.dto';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepo: Repository<Portfolio>,
    @InjectRepository(Asset)
    private assetRepo: Repository<Asset>,
    private marketService: MarketService,
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
      const costBasis = asset.quantity * asset.purchasePrice;
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

    return {
      summary: {
        portfolioId: portfolio.id,
        totalValue: portfolio.totalValue,
        totalCost: portfolio.totalCost,
        totalGainLoss: portfolio.totalGainLoss,
        totalReturnPercentage: portfolio.totalReturnPercentage,
        lastUpdated: portfolio.updatedAt,
      },
      assets: portfolio.assets.map((asset) => ({
        id: asset.id,
        type: asset.assetType,
        code: asset.code,
        name: asset.name,
        quantity: asset.quantity,
        purchasePrice: asset.purchasePrice,
        currentPrice: asset.currentPrice,
        currentValue: asset.currentValue,
        gainLoss: asset.gainLossAmount,
        gainLossPercentage: asset.gainLossPercentage,
      })),
    };
  }

  // Update asset
  async updateAsset(
    tokenUserId: number,
    portfolioId: string,
    assetId: string,
    data: UpdateAssetDto,
  ): Promise<any> {
    await this.verifyPortfolioOwnership(tokenUserId, portfolioId);

    await this.assetRepo.update(
      { id: assetId, portfolio: { id: portfolioId } },
      {
        ...data,
        portfolio: { id: portfolioId },
      },
    );

    await this.refreshPortfolio(tokenUserId);
  }

  // Remove asset
  async removeAsset(
    tokenUserId: number,
    portfolioId: string,
    assetId: string,
  ): Promise<void> {
    await this.verifyPortfolioOwnership(tokenUserId, portfolioId);

    const asset = await this.assetRepo.findOne({
      where: { id: assetId, portfolio: { id: portfolioId } },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    await this.assetRepo.remove(asset);
  }
}
