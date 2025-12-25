export interface User {
  firstName: string;
  lastName: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  assetType: string;
  quantity: number;
  price: number;
  currentValue: number;
  gainLossAmount: number;
  purchaseDate?: string;
}

export interface Transaction {
  id: string;
  assetCode: string;
  assetName: string;
  quantity: number;
  price: number;
  transactionType: string;
  createdAt: string;
}

export interface PortfolioSummary {
  portfolioId: string;
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalReturnPercentage: number;
}

export interface Portfolio {
  summary: PortfolioSummary;
  assets: Asset[];
  transactions: {
    records: Transaction[];
  };
}

export interface AssetType {
  title: string;
  value: string;
}

export interface AssetForm {
  code: string;
  name: string;
  assetType: string;
  quantity: number;
  price: number;
  purchaseDate: string;
}
