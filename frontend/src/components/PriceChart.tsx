import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PriceSnapshot } from '../api/types';

interface PriceChartProps {
  data: PriceSnapshot[];
  gameName: string;
}

export default function PriceChart({ data, gameName }: PriceChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center text-gray-400 py-4">
        暂无历史价格数据，请先手动刷新价格
      </div>
    );
  }

  const chartData = data.map((snapshot) => ({
    date: new Date(snapshot.fetchedAt).toLocaleDateString('zh-CN'),
    final: snapshot.isFree ? 0 : +(snapshot.finalCents / 100).toFixed(2),
    initial: snapshot.isFree ? 0 : +(snapshot.initialCents / 100).toFixed(2),
    discount: snapshot.discountPercent,
    status: snapshot.status,
  }));

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-300 mb-3">{gameName} 历史价格</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="price" stroke="#9CA3AF" tick={{ fontSize: 11 }} unit="¥" />
          <YAxis yAxisId="discount" orientation="right" stroke="#9CA3AF" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '6px' }}
            labelStyle={{ color: '#D1D5DB' }}
            formatter={(value: number, name: string) => {
              if (name === 'discount') return [`${value}%`, '折扣'];
              if (name === 'final') return [`¥${value}`, '现价'];
              if (name === 'initial') return [`¥${value}`, '原价'];
              return [value, name];
            }}
          />
          <Legend formatter={(value) => {
            if (value === 'final') return '现价';
            if (value === 'initial') return '原价';
            if (value === 'discount') return '折扣';
            return value;
          }} />
          <Line yAxisId="price" type="monotone" dataKey="final" stroke="#3B82F6" strokeWidth={2} dot={false} name="final" />
          <Line yAxisId="price" type="monotone" dataKey="initial" stroke="#6B7280" strokeWidth={1} strokeDasharray="5 5" dot={false} name="initial" />
          <Line yAxisId="discount" type="monotone" dataKey="discount" stroke="#F59E0B" strokeWidth={2} dot={false} name="discount" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
