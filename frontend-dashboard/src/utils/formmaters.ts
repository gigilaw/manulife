export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return "0.00";
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return "0.00%";
  return `${Number(value).toFixed(2)}%`;
};

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatAssetType = (type: string): string => {
  const map: Record<string, string> = {
    STOCK: "Stocks",
    MUTUAL_FUND: "Mutual Funds",
    BOND: "Bonds",
  };
  return map[type] || type;
};

export const formatTransactionType = (type: string): string => {
  const map: Record<string, string> = {
    BUY: "Buy",
    SELL: "Sell",
    UPDATE: "Update",
    DELETE: "Delete",
  };
  return map[type] || type;
};
