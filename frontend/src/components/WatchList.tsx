import React, { useState } from 'react';
import { api } from '../api/client';
import type { Watch, PriceSnapshot } from '../api/types';
import PriceChart from './PriceChart';

interface WatchListProps {
  watches: Watch[];
  loading: boolean;
  onRefresh: () => void;
}

export default function WatchList({ watches, loading, onRefresh }: WatchListProps) {
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<Record<number, PriceSnapshot[]>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{
    discountThreshold: number;
    priceThresholdEnabled: boolean;
    priceThresholdCents: string;
  }>({ discountThreshold: 50, priceThresholdEnabled: false, priceThresholdCents: '' });

  const handleRefresh = async (watchId: number) => {
    setRefreshingId(watchId);
    await api.refreshPrice(watchId);
    setRefreshingId(null);
    onRefresh();
  };

  const handleToggle = async (watch: Watch) => {
    await api.updateWatch(watch.id, { enabled: !watch.enabled });
    onRefresh();
  };

  const handleDelete = async (watchId: number) => {
    if (!confirm('确定要删除此监控吗？')) return;
    await api.deleteWatch(watchId);
    onRefresh();
  };

  const handleExpand = async (watch: Watch) => {
    if (expandedId === watch.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(watch.id);
    if (!historyData[watch.gameId]) {
      const res = await api.getPriceHistory(watch.gameId, 30);
      if (res.ok) {
        setHistoryData((prev) => ({ ...prev, [watch.gameId]: res.data as PriceSnapshot[] }));
      }
    }
  };

  const startEdit = (watch: Watch) => {
    setEditingId(watch.id);
    setEditData({
      discountThreshold: watch.discountThreshold,
      priceThresholdEnabled: watch.priceThresholdEnabled,
      priceThresholdCents: watch.priceThresholdCents ? (watch.priceThresholdCents / 100).toString() : '',
    });
  };

  const saveEdit = async (watchId: number) => {
    await api.updateWatch(watchId, {
      discountThreshold: editData.discountThreshold,
      priceThresholdEnabled: editData.priceThresholdEnabled,
      priceThresholdCents: editData.priceThresholdEnabled && editData.priceThresholdCents
        ? Math.round(parseFloat(editData.priceThresholdCents) * 100)
        : undefined,
    });
    setEditingId(null);
    onRefresh();
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-8">加载中...</div>;
  }

  if (watches.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
        暂无监控，请先搜索并添加游戏
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {watches.map((watch) => (
        <div key={watch.id} className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${watch.enabled ? 'bg-green-400' : 'bg-gray-500'}`}
                />
                <div>
                  <div className="font-medium">{watch.game.name}</div>
                  <div className="text-gray-400 text-xs">
                    AppID: {watch.game.steamAppId} · 折扣阈值: -{watch.discountThreshold}%
                    {watch.priceThresholdEnabled && watch.priceThresholdCents && (
                      <> · 价格 ≤ ¥{(watch.priceThresholdCents / 100).toFixed(2)}</>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRefresh(watch.id)}
                  disabled={refreshingId === watch.id}
                  className="px-2 py-1 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-600 rounded text-xs transition-colors"
                >
                  {refreshingId === watch.id ? '刷新中...' : '🔄 刷新'}
                </button>
                <button
                  onClick={() => handleExpand(watch)}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                >
                  📈 历史
                </button>
                <button
                  onClick={() => startEdit(watch)}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                >
                  ✏️ 编辑
                </button>
                <button
                  onClick={() => handleToggle(watch)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    watch.enabled
                      ? 'bg-yellow-700 hover:bg-yellow-600'
                      : 'bg-green-700 hover:bg-green-600'
                  }`}
                >
                  {watch.enabled ? '⏸ 暂停' : '▶ 启用'}
                </button>
                <button
                  onClick={() => handleDelete(watch.id)}
                  className="px-2 py-1 bg-red-800 hover:bg-red-700 rounded text-xs transition-colors"
                >
                  🗑 删除
                </button>
              </div>
            </div>

            {editingId === watch.id && (
              <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300 w-28">折扣阈值 (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editData.discountThreshold}
                    onChange={(e) =>
                      setEditData((d) => ({ ...d, discountThreshold: parseInt(e.target.value) || 0 }))
                    }
                    className="w-20 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300 w-28">启用价格阈值:</label>
                  <input
                    type="checkbox"
                    checked={editData.priceThresholdEnabled}
                    onChange={(e) =>
                      setEditData((d) => ({ ...d, priceThresholdEnabled: e.target.checked }))
                    }
                  />
                  {editData.priceThresholdEnabled && (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="金额(元)"
                      value={editData.priceThresholdCents}
                      onChange={(e) =>
                        setEditData((d) => ({ ...d, priceThresholdCents: e.target.value }))
                      }
                      className="w-28 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm"
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(watch.id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>

          {expandedId === watch.id && (
            <div className="border-t border-gray-700 p-4">
              <PriceChart data={historyData[watch.gameId] || []} gameName={watch.game.name} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
