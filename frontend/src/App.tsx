import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import WatchList from './components/WatchList';
import AdminPanel from './components/AdminPanel';
import { api } from './api/client';
import type { Watch } from './api/types';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [watches, setWatches] = useState<Watch[]>([]);
  const [watchesLoading, setWatchesLoading] = useState(false);

  const loadWatches = useCallback(async () => {
    setWatchesLoading(true);
    const res = await api.getWatchlist();
    if (res.ok) setWatches(res.data as Watch[]);
    setWatchesLoading(false);
  }, []);

  useEffect(() => {
    loadWatches();
  }, [loadWatches]);

  const handleWatchAdded = () => {
    loadWatches();
    setActiveTab('watchlist');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home onWatchAdded={handleWatchAdded} />;
      case 'watchlist':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">监控列表 ({watches.length})</h2>
              <button
                onClick={loadWatches}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              >
                🔄 刷新列表
              </button>
            </div>
            <WatchList watches={watches} loading={watchesLoading} onRefresh={loadWatches} />
          </div>
        );
      case 'admin':
        return <AdminPanel />;
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}
