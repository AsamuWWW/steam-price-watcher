import React, { useState } from 'react';
import { api } from '../api/client';
import type { SearchResult } from '../api/types';

interface GameSearchProps {
  onWatchAdded: () => void;
}

export default function GameSearch({ onWatchAdded }: GameSearchProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [showConfig, setShowConfig] = useState<number | null>(null);
  const [discountThreshold, setDiscountThreshold] = useState(50);
  const [priceThresholdEnabled, setPriceThresholdEnabled] = useState(false);
  const [priceThresholdYuan, setPriceThresholdYuan] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setError('');
    const res = await api.searchGames(keyword.trim());
    if (res.ok) {
      setResults(res.data as SearchResult[]);
      if ((res.data as SearchResult[]).length === 0) setError('未找到匹配游戏');
    } else {
      setError(res.error || '搜索失败');
    }
    setLoading(false);
  };

  const handleAddWatch = async (game: SearchResult) => {
    setAddingId(game.appid);
    const priceCents = priceThresholdEnabled && priceThresholdYuan
      ? Math.round(parseFloat(priceThresholdYuan) * 100)
      : undefined;

    const res = await api.createWatch({
      steamAppId: game.appid,
      name: game.name,
      discountThreshold,
      priceThresholdEnabled,
      priceThresholdCents: priceCents,
    });

    if (res.ok) {
      setAddedIds((prev) => new Set([...prev, game.appid]));
      setShowConfig(null);
      onWatchAdded();
    } else {
      alert(res.error || '添加失败');
    }
    setAddingId(null);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">搜索游戏</h2>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="输入游戏名称..."
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm font-medium transition-colors"
        >
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>

      {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((game) => (
            <div key={game.appid} className="bg-gray-700 rounded p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{game.name}</div>
                  <div className="text-gray-400 text-xs">AppID: {game.appid}</div>
                </div>
                <div className="flex gap-2">
                  {addedIds.has(game.appid) ? (
                    <span className="text-green-400 text-sm">✓ 已添加</span>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowConfig(showConfig === game.appid ? null : game.appid)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
                      >
                        配置
                      </button>
                      <button
                        onClick={() => handleAddWatch(game)}
                        disabled={addingId === game.appid}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm transition-colors"
                      >
                        {addingId === game.appid ? '添加中...' : '+ 添加监控'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {showConfig === game.appid && (
                <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-300 w-28">折扣阈值 (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountThreshold}
                      onChange={(e) => setDiscountThreshold(parseInt(e.target.value) || 50)}
                      className="w-20 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-300 w-28">价格阈值:</label>
                    <input
                      type="checkbox"
                      checked={priceThresholdEnabled}
                      onChange={(e) => setPriceThresholdEnabled(e.target.checked)}
                      className="mr-1"
                    />
                    {priceThresholdEnabled && (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="金额(元)"
                        value={priceThresholdYuan}
                        onChange={(e) => setPriceThresholdYuan(e.target.value)}
                        className="w-28 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
