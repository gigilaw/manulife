import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { PortfolioService } from '../src/services/portfolio.service';
import { Portfolio } from '../src/entities/portfolio.entity';
import { Asset } from '../src/entities/asset.entity';
import { MarketService } from '../src/services/market.service';
import { TransactionService } from '../src/services/transaction.service';
import { AssetDto } from '../src/dto/asset.dto';
import { AssetType, TransactionType } from '../src/constants';

// Mock data
const mockUser = {
  id: 1,
  email: 'user@test.com',
  firstName: 'Test',
  lastName: 'User',
};

const mockPortfolio = {
  id: 'portfolio-123',
  user: mockUser,
  totalValue: 0,
  totalCost: 0,
  totalGainLoss: 0,
  totalReturnPercentage: 0,
  updatedAt: new Date(),
  assets: [],
};

describe('PortfolioService', () => {
  let service: PortfolioService;
  let portfolioRepository: Repository<Portfolio>;
  let assetRepository: Repository<Asset>;
  let marketService: MarketService;
  let transactionService: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: getRepositoryToken(Portfolio),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            softRemove: jest.fn(),
          },
        },
        {
          provide: MarketService,
          useValue: {
            getAssetPrice: jest.fn(),
          },
        },
        {
          provide: TransactionService,
          useValue: {
            recordTransaction: jest.fn(),
            getUserTransactionsInfo: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    portfolioRepository = module.get<Repository<Portfolio>>(
      getRepositoryToken(Portfolio),
    );
    assetRepository = module.get<Repository<Asset>>(getRepositoryToken(Asset));
    marketService = module.get<MarketService>(MarketService);
    transactionService = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // CRITICAL: Financial Calculation Tests
  describe('refreshPortfolio', () => {
    it('should correctly calculate portfolio totals with multiple assets', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          code: 'AAPL',
          quantity: 10,
          price: 150.5,
          currentPrice: null,
          currentValue: null,
          gainLossAmount: null,
          gainLossPercentage: null,
        },
        {
          id: 'asset-2',
          code: 'GOOGL',
          quantity: 5,
          price: 2850.75,
          currentPrice: null,
          currentValue: null,
          gainLossAmount: null,
          gainLossPercentage: null,
        },
        {
          id: 'asset-3',
          code: 'MSFT',
          quantity: 15,
          price: 325.25,
          currentPrice: null,
          currentValue: null,
          gainLossAmount: null,
          gainLossPercentage: null,
        },
      ];

      const portfolioWithAssets = {
        ...mockPortfolio,
        assets: mockAssets,
      };

      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(portfolioWithAssets as any);

      // Current market prices
      jest
        .spyOn(marketService, 'getAssetPrice')
        .mockImplementation((code: string) => {
          if (code === 'AAPL') return 165.75; // Gain
          if (code === 'GOOGL') return 2800.5; // Loss
          if (code === 'MSFT') return 330.0; // Small gain
          return 0;
        });

      const updateSpy = jest.spyOn(assetRepository, 'update');
      const saveSpy = jest.spyOn(portfolioRepository, 'save');

      await service.refreshPortfolio(mockUser.id);

      // Verify calculations:
      // AAPL: 10 * $165.75 = $1,657.50 value, cost: 10 * $150.50 = $1,505.00, gain: $152.50
      // AAPL % gain: (152.50 / 1505.00) * 100 = 10.13%

      // GOOGL: 5 * $2800.50 = $14,002.50 value, cost: 5 * $2850.75 = $14,253.75, loss: -$251.25
      // GOOGL % loss: (-251.25 / 14253.75) * 100 = -1.76%

      // MSFT: 15 * $330.00 = $4,950.00 value, cost: 15 * $325.25 = $4,878.75, gain: $71.25
      // MSFT % gain: (71.25 / 4878.75) * 100 = 1.46%

      // Total: Value = 1657.50 + 14002.50 + 4950.00 = $20,610.00
      // Total Cost = 1505.00 + 14253.75 + 4878.75 = $20,637.50
      // Total Gain/Loss = 20610.00 - 20637.50 = -$27.50
      // Return % = (-27.50 / 20637.50) * 100 = -0.13%

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          totalValue: 20610.0,
          totalCost: 20637.5,
          totalGainLoss: -27.5,
          totalReturnPercentage: -0.13,
        }),
      );

      // Verify asset updates with proper precision
      expect(updateSpy).toHaveBeenCalledTimes(3);
      expect(updateSpy).toHaveBeenCalledWith(
        'asset-1',
        expect.objectContaining({
          currentPrice: 165.75,
          currentValue: 1657.5,
          gainLossAmount: 152.5,
          gainLossPercentage: 10.13,
        }),
      );
    });

    it('should throw NotFoundException when portfolio not found', async () => {
      jest.spyOn(portfolioRepository, 'findOne').mockResolvedValue(null);

      await expect(service.refreshPortfolio(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle empty portfolio (no assets)', async () => {
      const emptyPortfolio = {
        ...mockPortfolio,
        assets: [],
      };

      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(emptyPortfolio as any);
      const saveSpy = jest.spyOn(portfolioRepository, 'save');

      await service.refreshPortfolio(mockUser.id);

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          totalValue: 0,
          totalCost: 0,
          totalGainLoss: 0,
          totalReturnPercentage: 0,
        }),
      );
    });

    it('should handle large portfolio with many assets efficiently', async () => {
      // Create 100 mock assets
      const mockAssets = Array.from({ length: 100 }, (_, i) => ({
        id: `asset-${i}`,
        code: `STOCK${i}`,
        quantity: 10,
        price: 100 + i,
        currentPrice: null,
        currentValue: null,
        gainLossAmount: null,
        gainLossPercentage: null,
      }));

      const portfolioWithManyAssets = {
        ...mockPortfolio,
        assets: mockAssets,
      };

      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(portfolioWithManyAssets as any);
      jest.spyOn(marketService, 'getAssetPrice').mockReturnValue(150); // All assets gain 50%

      const updateSpy = jest.spyOn(assetRepository, 'update');

      await service.refreshPortfolio(mockUser.id);

      // Should update all 100 assets
      expect(updateSpy).toHaveBeenCalledTimes(100);
    });
  });

  // CRITICAL: Asset Update Logic Tests
  describe('updateAsset', () => {
    const portfolioId = 'portfolio-123';
    const assetId = 'asset-456';
    const mockAsset = {
      id: assetId,
      code: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'STOCK',
      quantity: 10,
      price: 150.75,
      portfolio: { id: portfolioId },
    };

    beforeEach(() => {
      jest
        .spyOn(service as any, 'verifyPortfolioOwnership')
        .mockResolvedValue(true);
    });

    it('should record BUY transaction when quantity increases', async () => {
      const existingAsset = { ...mockAsset, quantity: 10, price: 150.75 };
      const updateDto = { quantity: 15, price: 155.5 }; // Buying more at higher price

      jest
        .spyOn(assetRepository, 'findOne')
        .mockResolvedValue(existingAsset as any);
      jest
        .spyOn(assetRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any);
      const transactionSpy = jest
        .spyOn(transactionService, 'recordTransaction')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service, 'refreshPortfolio')
        .mockResolvedValue(mockPortfolio as any);

      await service.updateAsset(mockUser.id, portfolioId, assetId, updateDto);

      expect(transactionSpy).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          transactionType: TransactionType.BUY,
          quantity: 5, // 15 - 10
          price: 155.5, // New purchase price
        }),
      );
    });

    it('should record SELL transaction when quantity decreases', async () => {
      const existingAsset = { ...mockAsset, quantity: 20, price: 150.75 };
      const updateDto = { quantity: 15, price: 155.5 }; // Selling 5 shares

      jest
        .spyOn(assetRepository, 'findOne')
        .mockResolvedValue(existingAsset as any);
      jest
        .spyOn(assetRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any);
      const transactionSpy = jest
        .spyOn(transactionService, 'recordTransaction')
        .mockResolvedValue(undefined);

      jest
        .spyOn(service, 'refreshPortfolio')
        .mockResolvedValue(mockPortfolio as any);

      await service.updateAsset(mockUser.id, portfolioId, assetId, updateDto);

      expect(transactionSpy).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          transactionType: TransactionType.SELL,
          quantity: 5, // 20 - 15
          price: 155.5, // Sale price
        }),
      );
    });

    it('should record asset when quantity is set to 0', async () => {
      const existingAsset = { ...mockAsset, quantity: 10 };
      const updateDto = { quantity: 0, price: 150.75 };

      jest
        .spyOn(assetRepository, 'findOne')
        .mockResolvedValue(existingAsset as any);

      jest
        .spyOn(service, 'refreshPortfolio')
        .mockResolvedValue(mockPortfolio as any);

      await service.updateAsset(mockUser.id, portfolioId, assetId, updateDto);

      expect(transactionService.recordTransaction).toHaveBeenCalled();
    });

    it('should handle price-only update with recording transaction', async () => {
      const existingAsset = { ...mockAsset, quantity: 10, price: 150.75 };
      const updateDto = { quantity: 10, price: 155.5 };

      jest
        .spyOn(assetRepository, 'findOne')
        .mockResolvedValue(existingAsset as any);
      const transactionSpy = jest.spyOn(
        transactionService,
        'recordTransaction',
      );
      jest
        .spyOn(service, 'refreshPortfolio')
        .mockResolvedValue(mockPortfolio as any);

      await service.updateAsset(mockUser.id, portfolioId, assetId, updateDto);

      expect(transactionSpy).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when no changes detected', async () => {
      const existingAsset = { ...mockAsset, quantity: 10, price: 150.75 };
      const updateDto = { quantity: 10, price: 150.75 }; // Same values

      jest
        .spyOn(assetRepository, 'findOne')
        .mockResolvedValue(existingAsset as any);

      await expect(
        service.updateAsset(mockUser.id, portfolioId, assetId, updateDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle partial sell with proper transaction recording', async () => {
      const existingAsset = { ...mockAsset, quantity: 100, price: 150.75 };
      const updateDto = { quantity: 60, price: 155.5 }; // Selling 40 shares

      jest
        .spyOn(assetRepository, 'findOne')
        .mockResolvedValue(existingAsset as any);
      const transactionSpy = jest
        .spyOn(transactionService, 'recordTransaction')
        .mockResolvedValue(undefined);

      jest
        .spyOn(service, 'refreshPortfolio')
        .mockResolvedValue(mockPortfolio as any);

      await service.updateAsset(mockUser.id, portfolioId, assetId, updateDto);

      expect(transactionSpy).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          transactionType: TransactionType.SELL,
          quantity: 40, // 100 - 60
          price: 155.5,
        }),
      );
    });
  });

  // Asset Addition Tests
  describe('addAsset', () => {
    const portfolioId = 'portfolio-123';
    const assetDto: AssetDto = {
      assetType: AssetType.STOCK,
      code: 'AAPL',
      name: 'Apple Inc.',
      quantity: 10,
      price: 150.75,
      purchaseDate: new Date('2024-01-10T10:00:00Z').toISOString(),
    };

    beforeEach(() => {
      jest
        .spyOn(service as any, 'verifyPortfolioOwnership')
        .mockResolvedValue(true);
    });

    it('should create asset and record BUY transaction', async () => {
      const createdAsset = {
        id: 'new-asset-123',
        ...assetDto,
      };

      jest
        .spyOn(assetRepository, 'create')
        .mockReturnValue(createdAsset as any);
      jest
        .spyOn(assetRepository, 'save')
        .mockResolvedValue(createdAsset as any);
      const transactionSpy = jest
        .spyOn(transactionService, 'recordTransaction')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service, 'refreshPortfolio')
        .mockResolvedValue(mockPortfolio as any);

      const result = await service.addAsset(mockUser.id, assetDto, portfolioId);

      expect(result).toEqual(createdAsset);
      expect(transactionSpy).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          transactionType: TransactionType.BUY,
          quantity: assetDto.quantity,
          price: assetDto.price,
        }),
      );
      expect(service.refreshPortfolio).toHaveBeenCalledWith(mockUser.id);
    });
  });

  // Ownership Verification Tests
  describe('verifyPortfolioOwnership', () => {
    it('should allow access when user owns portfolio', async () => {
      const portfolioWithOwner = {
        ...mockPortfolio,
        user: { id: mockUser.id },
      };

      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(portfolioWithOwner as any);

      const result = await (service as any).verifyPortfolioOwnership(
        mockUser.id,
        mockPortfolio.id,
      );

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user does not own portfolio', async () => {
      const portfolioWithDifferentOwner = {
        ...mockPortfolio,
        user: { id: 999 }, // Different user
      };

      jest
        .spyOn(portfolioRepository, 'findOne')
        .mockResolvedValue(portfolioWithDifferentOwner as any);

      await expect(
        (service as any).verifyPortfolioOwnership(
          mockUser.id,
          mockPortfolio.id,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return true when portfolio not found (edge case)', async () => {
      jest.spyOn(portfolioRepository, 'findOne').mockResolvedValue(null);

      const result = await (service as any).verifyPortfolioOwnership(
        mockUser.id,
        'non-existent-portfolio',
      );

      expect(result).toBe(true);
    });
  });

  // Dashboard Integration Test
  describe('getDashboard', () => {
    it('should combine portfolio and transaction data correctly', async () => {
      const mockRefreshedPortfolio = {
        ...mockPortfolio,
        id: 'portfolio-123',
        totalValue: 25000.5,
        totalCost: 23500.75,
        totalGainLoss: 1499.75,
        totalReturnPercentage: 6.38,
        assets: [
          { id: 'asset-1', code: 'AAPL', quantity: 10, price: 150.75 },
          { id: 'asset-2', code: 'GOOGL', quantity: 5, price: 2850.5 },
        ],
        updatedAt: new Date('2024-01-15T10:30:00Z'),
      };

      const mockTransactionInfo = {
        transactions: [
          { id: 'tx-1', type: 'BUY', amount: 1507.5, date: new Date() },
          { id: 'tx-2', type: 'SELL', amount: 750.25, date: new Date() },
        ],
        totals: {
          count: 12,
          totalBuyAmount: 18500.5,
          totalSellAmount: 6750.25,
        },
      };

      // Mock portfolioRepo.createQueryBuilder
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockRefreshedPortfolio),
      };

      jest
        .spyOn(portfolioRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(service, 'refreshPortfolio').mockResolvedValue(undefined);
      jest
        .spyOn(transactionService, 'getUserTransactionsInfo')
        .mockResolvedValue(mockTransactionInfo as any);

      const result = await service.getDashboard(mockUser.id);

      expect(result).toEqual({
        summary: {
          portfolioId: 'portfolio-123',
          totalValue: 25000.5,
          totalCost: 23500.75,
          totalGainLoss: 1499.75,
          totalReturnPercentage: 6.38,
          lastUpdated: new Date('2024-01-15T10:30:00Z'),
        },
        assets: [
          { id: 'asset-1', code: 'AAPL', quantity: 10, price: 150.75 },
          { id: 'asset-2', code: 'GOOGL', quantity: 5, price: 2850.5 },
        ],
        transactions: {
          totalCount: 12,
          totalBuyAmount: 18500.5,
          totalSellAmount: 6750.25,
          netFlow: 11750.25, // 18500.50 - 6750.25
          records: [
            { id: 'tx-1', type: 'BUY', amount: 1507.5, date: expect.any(Date) },
            {
              id: 'tx-2',
              type: 'SELL',
              amount: 750.25,
              date: expect.any(Date),
            },
          ],
        },
      });

      // Verify query builder was called correctly
      expect(portfolioRepository.createQueryBuilder).toHaveBeenCalledWith(
        'portfolio',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'portfolio.assets',
        'assets',
        'assets.quantity > 0',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'portfolio.user.id = :userId',
        { userId: mockUser.id },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'assets.code',
        'ASC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'assets.name',
        'ASC',
      );
    });
  });

  describe('removeAsset', () => {
    it('should remove asset by ID successfully', async () => {
      const portfolioId = 'portfolio-123';
      const assetId = 'asset-456';
      const mockAsset = {
        id: assetId,
        portfolio: { id: portfolioId },
        code: 'AAPL',
        name: 'Apple Inc.',
        assetType: 'stock',
        quantity: 10,
        price: 150.75,
      };

      // Mock verifyPortfolioOwnership to resolve (not throw)
      jest
        .spyOn(service as any, 'verifyPortfolioOwnership')
        .mockResolvedValue(undefined); // or mockResolvedValue({ id: portfolioId })

      // Mock findOne to return the asset
      jest
        .spyOn(assetRepository, 'findOne')
        .mockResolvedValue(mockAsset as any);

      // Mock softRemove
      jest.spyOn(assetRepository, 'softRemove').mockResolvedValue({} as any);

      // Mock recordTransaction
      jest
        .spyOn(transactionService, 'recordTransaction')
        .mockResolvedValue(undefined);

      // Mock refreshPortfolio
      jest.spyOn(service, 'refreshPortfolio').mockResolvedValue(undefined);

      await service.removeAsset(mockUser.id, portfolioId, assetId);

      expect(service['verifyPortfolioOwnership']).toHaveBeenCalledWith(
        mockUser.id,
        portfolioId,
      );
      expect(assetRepository.findOne).toHaveBeenCalledWith({
        where: { id: assetId, portfolio: { id: portfolioId } },
      });
      expect(assetRepository.softRemove).toHaveBeenCalledWith(mockAsset);
      expect(transactionService.recordTransaction).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          transactionType: 'DELETE',
          assetCode: 'AAPL',
          assetName: 'Apple Inc.',
          quantity: 10,
          price: 150.75,
        }),
      );
      expect(service.refreshPortfolio).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException when asset not found', async () => {
      const portfolioId = 'portfolio-123';
      const assetId = 'non-existent-asset';

      // Mock verifyPortfolioOwnership to resolve
      jest
        .spyOn(service as any, 'verifyPortfolioOwnership')
        .mockResolvedValue(undefined);

      // Mock findOne to return null (asset not found)
      jest.spyOn(assetRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.removeAsset(mockUser.id, portfolioId, assetId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.removeAsset(mockUser.id, portfolioId, assetId),
      ).rejects.toThrow('Asset not found');
    });
  });
});
