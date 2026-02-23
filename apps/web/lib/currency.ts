// Currency and formatting utilities for Contribly
// All amounts are stored as cents (divide by 100 for display)

export const CURRENCY = {
  code: "KES",
  symbol: "Ksh",
  name: "Kenyan Shilling",
};

export const formatCurrency = (amountInCents: number | string, options?: { symbol?: boolean; decimals?: number }) => {
  const amount = typeof amountInCents === "string" ? parseInt(amountInCents, 10) : amountInCents;
  const decimals = options?.decimals ?? 2;
  const displayAmount = (amount / 100).toFixed(decimals);
  
  // Add thousands separators
  const parts = displayAmount.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedAmount = parts.join('.');
  
  const symbol = options?.symbol !== false ? `${CURRENCY.symbol} ` : "";
  return `${symbol}${formattedAmount}`;
};

export const parseCurrencyInput = (value: string): number => {
  // Remove any non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, "");
  const amount = parseFloat(cleaned) || 0;
  return Math.round(amount * 100); // Convert to cents
};
