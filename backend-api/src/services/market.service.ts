import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  // Mock prices
  getAssetPrice(code: string): number {
    // Generate a mock price based on code so it makes sure same code will get similar base price
    const hash = code
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = 5 + (hash % 200);
    // Add random varition
    const variation = (Math.random() - 0.5) * 10;

    return Number((basePrice + variation).toFixed(2));
  }
}
