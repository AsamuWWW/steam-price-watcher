import React from 'react';
import GameSearch from '../components/GameSearch';

interface HomeProps {
  onWatchAdded: () => void;
}

export default function Home({ onWatchAdded }: HomeProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-blue-400 mb-2">🎮 Steam 价格监控</h1>
        <p className="text-gray-400">
          监控您喜爱的 Steam 游戏价格，当折扣达到您设定的阈值时自动通知。
        </p>
        <div className="mt-3 flex gap-4 text-sm text-gray-400">
          <span>✅ 支持 CN 区价格</span>
          <span>✅ 每日自动抓取</span>
          <span>✅ 折扣 + 价格双阈值</span>
          <span>✅ 历史价格曲线</span>
        </div>
      </div>
      <GameSearch onWatchAdded={onWatchAdded} />
    </div>
  );
}
