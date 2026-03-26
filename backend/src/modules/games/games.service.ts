import { Injectable } from '@nestjs/common';
import { SteamClient } from '../../common/steam/steam.client';

@Injectable()
export class GamesService {
  constructor(private readonly steamClient: SteamClient) {}

  async search(keyword: string, limit = 20) {
    return this.steamClient.searchApps(keyword, limit);
  }
}
