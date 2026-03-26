import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import type { Notification } from '../api/types';

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.readAt);

  const loadNotifications = async () => {
    setLoading(true);
    const res = await api.getNotifications();
    if (res.ok) setNotifications(res.data as Notification[]);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: number) => {
    await api.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
  };

  const typeLabel = (type: string) => {
    if (type === 'PRICE_BELOW') return '💰 低价';
    if (type === 'DISCOUNT_REACHED') return '🏷️ 折扣';
    return '⚠️ 错误';
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded hover:bg-gray-700 transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <span className="font-medium">通知 ({unread.length} 未读)</span>
            {loading && <span className="text-gray-400 text-sm">加载中...</span>}
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-400">暂无通知</div>
          ) : (
            <div>
              {notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`p-3 border-b border-gray-700 ${!n.readAt ? 'bg-blue-900/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-1">{typeLabel(n.type)}</div>
                      <div className="text-sm">{n.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(n.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    {!n.readAt && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 shrink-0"
                      >
                        标已读
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
