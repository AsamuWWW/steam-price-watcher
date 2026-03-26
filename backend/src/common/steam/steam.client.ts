import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SteamSearchResult, SteamPriceInfo } from './steam.types';

@Injectable()
export class SteamClient {
  private readonly logger = new Logger(SteamClient.name);
  private readonly cc: string;
  private readonly language: string;
  private readonly timeout: number = 10000;

  constructor() {
    this.cc = process.env.STEAM_CC || 'cn';
    this.language = process.env.STEAM_LANGUAGE || 'schinese';
  }

  async searchApps(keyword: string, limit = 20): Promise<SteamSearchResult[]> {
    try {
      const url = `https://store.steampowered.com/search/suggest`;
      const response = await axios.get(url, {
        params: {
          term: keyword,
          f: 'games',
          cc: this.cc,
          l: this.language,
          use_store_query: 1,
          category1: 998,
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SteamPriceWatcher/1.0)',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
      });

      return this.parseSearchHtml(response.data, limit);
    } catch (error) {
      this.logger.error(`Failed to search Steam apps: ${error.message}`);
      return this.fallbackSearch(keyword, limit);
    }
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

  private async fallbackSearch(keyword: string, limit: number): Promise<SteamSearchResult[]> {
    try {
      const url = `https://store.steampowered.com/api/storesearch/`;
      const response = await axios.get(url, {
        params: {
          term: keyword,
          cc: this.cc,
          l: this.language,
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SteamPriceWatcher/1.0)',
        },
      });

      if (response.data?.items) {
        return response.data.items.slice(0, limit).map((item: any) => ({
          appid: item.id,
          name: item.name,
        }));
      }
      return [];
    } catch (error) {
      this.logger.error(`Fallback search also failed: ${error.message}`);
      return [];
    }
  }

  async getAppPrice(appid: number): Promise<SteamPriceInfo> {
    try {
      const url = `https://store.steampowered.com/api/appdetails`;
      const response = await axios.get(url, {
        params: {
          appids: appid,
          cc: this.cc,
          filters: 'price_overview,basic_info',
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SteamPriceWatcher/1.0)',
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
      this.logger.error(`Failed to get price for appid ${appid}: ${error.message}`);
      throw new Error(`Failed to fetch price for appid ${appid}: ${error.message}`);
    }
  }
}
