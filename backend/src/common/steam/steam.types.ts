export interface SteamSearchResult {
  appid: number;
  name: string;
}

export interface SteamPriceInfo {
  appid: number;
  status: 'OK' | 'FREE' | 'NO_PRICE' | 'UNAVAILABLE';
  isFree: boolean;
  currency: string;
  finalCents: number;
  initialCents: number;
  discountPercent: number;
  name?: string;
}
