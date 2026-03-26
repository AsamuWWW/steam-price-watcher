export function centsToYuan(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function parsePrice(priceString: string): number {
  // Remove currency symbols and parse
  const cleaned = priceString.replace(/[^0-9.]/g, '');
  return Math.round(parseFloat(cleaned) * 100) || 0;
}
