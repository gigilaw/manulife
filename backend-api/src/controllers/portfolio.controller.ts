import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { PortfolioService } from '../services/portfolio.service';
import { AssetDto, UpdateAssetDto } from '../dto/asset.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { AssetType } from '../constants';
import { Asset } from '../entities/asset.entity';

interface JwtUser {
  userId: number;
  email: string;
}

@Controller('portfolio')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get portfolio dashboard',
    description:
      'Returns portfolio summary with refreshed asset prices and performance metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found',
  })
  async dashboard(@Req() req: Request) {
    const user = req['user'] as JwtUser;
    return this.portfolioService.getDashboard(user.userId);
  }

  @Put(':portfolioId/assets/:assetId')
  @ApiOperation({
    summary: 'Update an asset',
    description: 'Update asset details like quantity or purchase price',
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio UUID',
    example: '9f6ce7e5-269f-4e4c-888f-0d3bb5458ade',
  })
  @ApiParam({
    name: 'assetId',
    description: 'Asset UUID',
    example: '3a2b1c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @ApiBody({
    type: UpdateAssetDto,
    examples: {
      updateQuantity: {
        summary: 'Update quantity',
        value: { quantity: 15 },
      },
      updatePurchasePrice: {
        summary: 'Update purchase price',
        value: { price: 125.5 },
      },
    },
  })
  @ApiResponse({
    description: 'Asset updated successfully',
    status: 200,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not own this portfolio',
  })
  @ApiResponse({
    status: 403,
    description: 'No changes detected in asset update',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or asset not found',
  })
  async updateAsset(
    @Req() req: Request,
    @Param('portfolioId') portfolioId: string,
    @Param('assetId') assetId: string,
    @Body() data: UpdateAssetDto,
  ): Promise<Asset> {
    const user = req['user'] as JwtUser;
    return await this.portfolioService.updateAsset(
      user.userId,
      portfolioId,
      assetId,
      data,
    );
  }

  @Post(':portfolioId/assets')
  @ApiOperation({
    summary: 'Add a new asset',
    description: 'Add a new asset to the portfolio',
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio UUID',
    example: '9f6ce7e5-269f-4e4c-888f-0d3bb5458ade',
  })
  @ApiBody({
    type: AssetDto,
    examples: {
      stockExample: {
        summary: 'Add a stock',
        value: {
          assetType: AssetType,
          code: '0308',
          name: 'CSL',
          quantity: 10,
          price: 150.0,
        },
      },
    },
  })
  @ApiResponse({
    description: 'Returns Asset',
    status: 200,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not own this portfolio',
  })
  async addAsset(
    @Req() req: Request,
    @Param('portfolioId') portfolioId: string,
    @Body() data: AssetDto,
  ): Promise<Asset> {
    const user = req['user'] as JwtUser;
    return this.portfolioService.addAsset(user.userId, data, portfolioId);
  }

  @Delete(':portfolioId/assets/:assetId')
  @ApiOperation({
    summary: 'Remove an asset',
    description: 'Delete an asset from the portfolio',
  })
  @ApiParam({
    name: 'portfolioId',
    description: 'Portfolio UUID',
    example: '9f6ce7e5-269f-4e4c-888f-0d3bb5458ade',
  })
  @ApiParam({
    name: 'assetId',
    description: 'Asset UUID',
    example: '3a2b1c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not own this portfolio',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or asset not found',
  })
  async removeAsset(
    @Req() req: Request,
    @Param('portfolioId') portfolioId: string,
    @Param('assetId') assetId: string,
  ) {
    const user = req['user'] as JwtUser;
    await this.portfolioService.removeAsset(user.userId, portfolioId, assetId);
    return { message: 'Asset removed' };
  }
}
