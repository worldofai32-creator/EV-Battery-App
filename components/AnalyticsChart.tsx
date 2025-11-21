import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { EVReading } from '../types';

interface AnalyticsChartProps {
  history: EVReading[];
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-800 rounded-2xl border border-slate-700">
        No history data available for analytics.
      </div>
    );
  }

  // Format data for charts
  const chartData = history.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    battery: item.batteryPercentage,
    range: item.estimatedRangeKm
  })).reverse(); // Show oldest to newest

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Battery Usage Trend */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-6 pl-2 border-l-4 border-emerald-500">Battery Usage Trend</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Area type="monotone" dataKey="battery" stroke="#10b981" fillOpacity={1} fill="url(#colorBattery)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Range Estimation History */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-6 pl-2 border-l-4 border-blue-500">Estimated Range History</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                cursor={{fill: '#334155', opacity: 0.4}}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="range" name="Range (km)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;
