import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { SteamSearchResult, SteamPriceInfo } from './steam.types';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class SteamClient {
  private readonly logger = new Logger(SteamClient.name);
  private readonly cc: string;
  private readonly language: string;
  /** Per-request timeout in ms. Lowered so both attempts finish well under 20 s. */
  private readonly timeout: number = 6000;
  /** How long (ms) to cache search results in memory. */
  private readonly cacheTtl: number = 5 * 60 * 1000;
  private readonly searchCache = new Map<string, CacheEntry<SteamSearchResult[]>>();

  /**
   * Standard browser-like headers that help Steam return results instead of
   * blocking or heavily throttling the request.
   */
  private readonly browserHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    Referer: 'https://store.steampowered.com/',
  };

  constructor() {
    this.cc = process.env.STEAM_CC || 'cn';
    this.language = process.env.STEAM_LANGUAGE || 'schinese';
  }

  async searchApps(keyword: string, limit = 20): Promise<SteamSearchResult[]> {
    const cacheKey = `${keyword}:${limit}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      this.logger.debug(`Search cache hit for "${keyword}"`);
      return cached.data;
    }

    const results = await this.doSearchApps(keyword, limit);

    if (results.length > 0) {
      this.searchCache.set(cacheKey, {
        data: results,
        expiresAt: Date.now() + this.cacheTtl,
      });
    }

    return results;
  }

  private async doSearchApps(keyword: string, limit: number): Promise<SteamSearchResult[]> {
    // Primary: Steam's HTML suggest endpoint
    try {
      const url = `https://store.steampowered.com/search/suggest`;
      const response = await this.axiosGetWithRetry(url, {
        params: {
          term: keyword,
          f: 'games',
          cc: this.cc,
          l: this.language,
          use_store_query: 1,
          category1: 998,
        },
        headers: this.browserHeaders,
      });

      const parsed = this.parseSearchHtml(response.data, limit);
      if (parsed.length > 0) {
        return parsed;
      }
    } catch (error) {
      this.logger.error(`Failed to search Steam apps: ${(error as Error).message}`);
    }

    // First fallback: JSON storesearch API
    try {
      const url = `https://store.steampowered.com/api/storesearch/`;
      const response = await this.axiosGetWithRetry(url, {
        params: {
          term: keyword,
          cc: this.cc,
          l: this.language,
        },
        headers: {
          ...this.browserHeaders,
          Accept: 'application/json, text/plain, */*',
        },
      });

      if (response.data?.items?.length) {
        return response.data.items.slice(0, limit).map((item: any) => ({
          appid: item.id,
          name: item.name,
        }));
      }
    } catch (error) {
      this.logger.error(`Fallback search also failed: ${(error as Error).message}`);
    }

    // Second fallback: Steam Store search page (returns JSON list of items)
    try {
      const url = `https://store.steampowered.com/search/suggest`;
      const response = await this.axiosGetWithRetry(url, {
        params: {
          term: keyword,
          f: 'games',
          cc: 'us',
          l: 'english',
          use_store_query: 1,
          category1: 998,
        },
        headers: this.browserHeaders,
      });

      const parsed = this.parseSearchHtml(response.data, limit);
      if (parsed.length > 0) {
        this.logger.warn(`Used US/English fallback for search "${keyword}"`);
        return parsed;
      }
    } catch (error) {
      this.logger.error(`Second fallback search failed: ${(error as Error).message}`);
    }

    return [];
  }

  /**
   * Wraps axios.get with up to one retry on network / timeout errors.
   */
  private async axiosGetWithRetry(url: string, config: AxiosRequestConfig, retries = 1): Promise<any> {
    const reqConfig = { ...config, timeout: this.timeout };
    try {
      return await axios.get(url, reqConfig);
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        this.logger.warn(`Retrying request to ${url} (${retries} attempt(s) left)`);
        await this.delay(500);
        return this.axiosGetWithRetry(url, config, retries - 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    if (!error.response) {
      // Network error or timeout — safe to retry
      return true;
    }
    // Retry on 429 (rate-limit) or 5xx server errors
    return error.response.status === 429 || error.response.status >= 500;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parseSearchHtml(html: string, limit: number): SteamSearchResult[] {
    const results: SteamSearchResult[] = [];
    // Match data-ds-appid and game name from suggest results
    const appIdRegex = /data-ds-appid="(\d+)"/g;
    const nameRegex = /<span class="match_name">([^<]+)<\/span>/g;

    const appIds: number[] = [];
    const names: string[] = [];

    let match;
    while ((match = appIdRegex.exec(html)) !== null) {
      appIds.push(parseInt(match[1]));
    }
    while ((match = nameRegex.exec(html)) !== null) {
      names.push(match[1].trim());
    }

    const count = Math.min(appIds.length, names.length, limit);
    for (let i = 0; i < count; i++) {
      results.push({ appid: appIds[i], name: names[i] });
    }

    return results;
  }

  async getAppPrice(appid: number): Promise<SteamPriceInfo> {
    try {
      const url = `https://store.steampowered.com/api/appdetails`;
      const response = await this.axiosGetWithRetry(url, {
        params: {
          appids: appid,
          cc: this.cc,
          filters: 'price_overview,basic_info',
        },
        headers: {
          ...this.browserHeaders,
          Accept: 'application/json, text/plain, */*',
        },
      });

      const data = response.data?.[appid.toString()];
      if (!data?.success) {
        return {
          appid,
          status: 'UNAVAILABLE',
          isFree: false,
          currency: 'CNY',
          finalCents: 0,
          initialCents: 0,
          discountPercent: 0,
        };
      }

      const appData = data.data;

      if (appData?.is_free) {
        return {
          appid,
          status: 'FREE',
          isFree: true,
          currency: 'CNY',
          finalCents: 0,
          initialCents: 0,
          discountPercent: 0,
          name: appData.name,
        };
      }

      const priceOverview = appData?.price_overview;
      if (!priceOverview) {
        return {
          appid,
          status: 'NO_PRICE',
          isFree: false,
          currency: 'CNY',
          finalCents: 0,
          initialCents: 0,
          discountPercent: 0,
          name: appData?.name,
        };
      }

      return {
        appid,
        status: 'OK',
        isFree: false,
        currency: priceOverview.currency || 'CNY',
        finalCents: priceOverview.final || 0,
        initialCents: priceOverview.initial || 0,
        discountPercent: priceOverview.discount_percent || 0,
        name: appData.name,
      };
    } catch (error) {
      this.logger.error(`Failed to get price for appid ${appid}: ${(error as Error).message}`);
      throw new Error(`Failed to fetch price for appid ${appid}: ${(error as Error).message}`);
    }
  }
}
