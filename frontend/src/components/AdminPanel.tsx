import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { AdminOverview } from '../api/types';

export default function AdminPanel() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const loadOverview = async () => {
    setLoading(true);
    const res = await api.getAdminOverview();
    if (res.ok) {
      setOverview(res.data as AdminOverview);
      setError('');
    } else {
      if (res.error?.includes('403') || res.error?.includes('Forbidden') || res.error?.includes('internal')) {
        setError('仅内网可访问管理面板');
      } else {
        setError(res.error || '加载失败');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleTriggerDaily = async () => {
    setTriggering(true);
    const res = await api.triggerDaily();
    if (res.ok) {
      alert('已触发每日任务');
      await loadOverview();
    } else {
      alert(res.error || '触发失败');
    }
    setTriggering(false);
  };

  if (loading) return <div className="text-center text-gray-400 py-8">加载中...</div>;

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center">
          <div className="text-yellow-400 text-4xl mb-3">🔒</div>
          <div className="text-lg font-medium mb-2">访问受限</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">管理面板</h2>
        <button
          onClick={handleTriggerDaily}
          disabled={triggering}
          className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 rounded text-sm font-medium transition-colors"
        >
          {triggering ? '触发中...' : '🚀 手动触发每日任务'}
        </button>
      </div>

      {/* Recent Job Runs */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium mb-3">最近任务运行</h3>
        {overview.recentJobRuns.length === 0 ? (
          <div className="text-gray-400 text-sm">暂无记录</div>
        ) : (
          <div className="space-y-2">
            {overview.recentJobRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between bg-gray-700 rounded p-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    run.status === 'SUCCESS' ? 'bg-green-800 text-green-300' :
                    run.status === 'FAILED' ? 'bg-red-800 text-red-300' :
                    'bg-yellow-800 text-yellow-300'
                  }`}>{run.status}</span>
                  <span className="text-gray-300">{run.jobName}</span>
                  {run.statsJson && (
                    <span className="text-gray-400 text-xs">
                      {(() => {
                        try {
                          const s = JSON.parse(run.statsJson);
                          return `成功: ${s.success}, 失败: ${s.failed}`;
                        } catch { return ''; }
                      })()}
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-xs">
                  {new Date(run.startedAt).toLocaleString('zh-CN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Errors */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium mb-3">最近错误</h3>
        {overview.recentErrors.length === 0 ? (
          <div className="text-gray-400 text-sm">暂无错误</div>
        ) : (
          <div className="space-y-2">
            {overview.recentErrors.map((err) => (
              <div key={err.id} className="bg-red-900/20 border border-red-800 rounded p-2 text-sm">
                <div className="font-medium text-red-400">{err.watch?.game?.name}</div>
                <div className="text-gray-300">{err.message}</div>
                <div className="text-gray-500 text-xs mt-1">
                  {new Date(err.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Audit Logs */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium mb-3">审计日志</h3>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {overview.recentAuditLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-gray-700 rounded font-mono">{log.action}</span>
                {log.ip && <span className="text-gray-500">{log.ip}</span>}
              </div>
              <span className="text-gray-400">{new Date(log.createdAt).toLocaleString('zh-CN')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
