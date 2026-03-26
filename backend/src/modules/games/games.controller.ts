import { Controller, Get, Query } from '@nestjs/common';
import { GamesService } from './games.service';
import { SearchGamesDto } from './dto/search-games.dto';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('search')
  async search(@Query() query: SearchGamesDto) {
    const results = await this.gamesService.search(query.keyword, query.limit);
    return { ok: true, data: results, error: null };
  }
}
