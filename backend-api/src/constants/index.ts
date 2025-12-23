export const constants = {
  accessTokenTTL: '15m',
  refreshTokenTTL: '2h',
} as const;

export enum AssetType {
  STOCK = 'STOCK',
  BOND = 'BOND',
  MUTUAL_FUND = 'MUTUAL_FUND',
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}
