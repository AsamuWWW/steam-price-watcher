import { SteamClient } from './steam.client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SteamClient', () => {
  let client: SteamClient;

  beforeEach(() => {
    client = new SteamClient();
    jest.clearAllMocks();
  });

  describe('searchApps', () => {
    const sampleHtml = `
      <a class="match" data-ds-appid="570">
        <span class="match_name">Dota 2</span>
      </a>
      <a class="match" data-ds-appid="730">
        <span class="match_name">Counter-Strike 2</span>
      </a>
    `;

    it('returns parsed results from the suggest endpoint', async () => {
      mockedAxios.get = jest.fn().mockResolvedValueOnce({ data: sampleHtml });

      const results = await client.searchApps('dota', 5);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ appid: 570, name: 'Dota 2' });
      expect(results[1]).toEqual({ appid: 730, name: 'Counter-Strike 2' });
    });

    it('falls back to storesearch API when the suggest endpoint fails', async () => {
      mockedAxios.get = jest
        .fn()
        // Primary suggest call — timeout
        .mockRejectedValueOnce(Object.assign(new Error('timeout of 6000ms exceeded'), { response: undefined }))
        // Retry of suggest
        .mockRejectedValueOnce(Object.assign(new Error('timeout of 6000ms exceeded'), { response: undefined }))
        // Fallback storesearch call
        .mockResolvedValueOnce({
          data: { items: [{ id: 570, name: 'Dota 2' }] },
        });

      const results = await client.searchApps('dota', 5);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ appid: 570, name: 'Dota 2' });
    });

    it('falls back to US/English suggest when cn suggest and storesearch both fail', async () => {
      mockedAxios.get = jest
        .fn()
        // Primary suggest (cn) — timeout x2 (request + retry)
        .mockRejectedValueOnce(Object.assign(new Error('timeout'), { response: undefined }))
        .mockRejectedValueOnce(Object.assign(new Error('timeout'), { response: undefined }))
        // Fallback storesearch — timeout x2
        .mockRejectedValueOnce(Object.assign(new Error('timeout'), { response: undefined }))
        .mockRejectedValueOnce(Object.assign(new Error('timeout'), { response: undefined }))
        // Second fallback: US suggest succeeds
        .mockResolvedValueOnce({ data: sampleHtml });

      const results = await client.searchApps('dota', 5);

      expect(results).toHaveLength(2);
    });

    it('returns empty array when all endpoints fail', async () => {
      mockedAxios.get = jest
        .fn()
        .mockRejectedValue(Object.assign(new Error('timeout'), { response: undefined }));

      const results = await client.searchApps('dota', 5);

      expect(results).toEqual([]);
    });

    it('returns cached results on the second call', async () => {
      mockedAxios.get = jest.fn().mockResolvedValueOnce({ data: sampleHtml });

      const results1 = await client.searchApps('dota', 5);
      const results2 = await client.searchApps('dota', 5);

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(results1).toEqual(results2);
    });

    it('uses modern Chrome User-Agent in the request headers', async () => {
      mockedAxios.get = jest.fn().mockResolvedValueOnce({ data: sampleHtml });

      await client.searchApps('dota', 5);

      const callHeaders = (mockedAxios.get as jest.Mock).mock.calls[0][1].headers;
      expect(callHeaders['User-Agent']).toContain('Chrome');
    });
  });

  describe('getAppPrice', () => {
    it('returns OK price info for a priced game', async () => {
      mockedAxios.get = jest.fn().mockResolvedValueOnce({
        data: {
          '570': {
            success: true,
            data: {
              name: 'Dota 2',
              is_free: false,
              price_overview: {
                currency: 'CNY',
                final: 0,
                initial: 0,
                discount_percent: 0,
              },
            },
          },
        },
      });

      const price = await client.getAppPrice(570);

      expect(price.status).toBe('OK');
      expect(price.name).toBe('Dota 2');
    });

    it('returns FREE status for a free game', async () => {
      mockedAxios.get = jest.fn().mockResolvedValueOnce({
        data: {
          '570': {
            success: true,
            data: { name: 'Dota 2', is_free: true },
          },
        },
      });

      const price = await client.getAppPrice(570);

      expect(price.status).toBe('FREE');
      expect(price.isFree).toBe(true);
    });

    it('returns UNAVAILABLE when success is false', async () => {
      mockedAxios.get = jest.fn().mockResolvedValueOnce({
        data: { '99999': { success: false } },
      });

      const price = await client.getAppPrice(99999);

      expect(price.status).toBe('UNAVAILABLE');
    });

    it('throws on network error', async () => {
      mockedAxios.get = jest
        .fn()
        .mockRejectedValue(Object.assign(new Error('Network Error'), { response: undefined }));

      await expect(client.getAppPrice(570)).rejects.toThrow('Failed to fetch price for appid 570');
    });
  });
});
