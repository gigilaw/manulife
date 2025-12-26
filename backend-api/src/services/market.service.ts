import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  // Mock prices
  getAssetPrice(code: string): number {
    const hash = code
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Different price tiers based on hash
    let basePrice: number;
    const hashMod = hash % 10;

    if (hashMod < 3) {
      // Low-priced stocks: $1-$50
      basePrice = 1 + (hash % 50);
    } else if (hashMod < 7) {
      // Mid-priced stocks: $50-$200
      basePrice = 50 + (hash % 150);
    } else {
      // High-priced stocks: $200-$1000
      basePrice = 200 + (hash % 800);
    }

    // Add percentage-based variation (±10%)
    const percentChange = (Math.random() - 0.5) * 0.2;
    const price = basePrice * (1 + percentChange);

    return Number(Math.max(0.01, price).toFixed(2));
  }
}
