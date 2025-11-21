import React from 'react';
import { Zap, Clock, Navigation } from 'lucide-react';
import { EstimationResponse } from '../types';

interface BatteryDisplayProps {
  percentage: number;
  estimates: EstimationResponse | null;
  loading: boolean;
}

const BatteryDisplay: React.FC<BatteryDisplayProps> = ({ percentage, estimates, loading }) => {
  // Color logic based on percentage
  const getColor = (p: number) => {
    if (p > 50) return 'text-emerald-400 stroke-emerald-400';
    if (p > 20) return 'text-yellow-400 stroke-yellow-400';
    return 'text-red-500 stroke-red-500';
  };

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const colorClass = getColor(percentage);

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700 flex flex-col md:flex-row items-center justify-around gap-8 relative overflow-hidden">
      
      {/* Background Glow Effect */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${percentage > 20 ? 'emerald' : 'red'}-500 to-transparent opacity-50`}></div>

      {/* Main Gauge */}
      <div className="relative w-64 h-64 flex-shrink-0">
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-slate-700"
          />
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <span className="text-6xl font-bold font-mono">{percentage}%</span>
          <span className="text-slate-400 text-sm mt-2 uppercase tracking-wider">Battery Level</span>
          {percentage < 20 && (
            <div className="mt-2 flex items-center text-red-400 animate-pulse">
              <Zap className="w-4 h-4 mr-1" />
              <span className="text-xs font-bold">Low Battery</span>
            </div>
          )}
        </div>
      </div>

      {/* Estimates Panel */}
      <div className="flex-grow w-full max-w-md space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4 border-b border-slate-700 pb-2">
          Live Estimates
        </h3>
        
        {loading ? (
           <div className="animate-pulse space-y-4">
             <div className="h-12 bg-slate-700 rounded w-full"></div>
             <div className="h-12 bg-slate-700 rounded w-full"></div>
           </div>
        ) : estimates ? (
          <>
            <div className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg border border-slate-600 hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center text-slate-300">
                <Navigation className="w-5 h-5 mr-3 text-blue-400" />
                <span>Estimated Range</span>
              </div>
              <span className="text-2xl font-bold text-white">{estimates.rangeKm.toFixed(1)} <span className="text-sm text-slate-400">km</span></span>
            </div>

            <div className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg border border-slate-600 hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center text-slate-300">
                <Clock className="w-5 h-5 mr-3 text-orange-400" />
                <span>Time Remaining</span>
              </div>
              <span className="text-2xl font-bold text-white">{estimates.timeLeftHours.toFixed(1)} <span className="text-sm text-slate-400">hrs</span></span>
            </div>

            <div className="mt-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-sm text-blue-200">
              <span className="font-semibold">AI Insight:</span> {estimates.efficiencyNote}
            </div>
          </>
        ) : (
          <div className="text-slate-500 text-center py-4">Enter battery data to see estimates</div>
        )}
      </div>
    </div>
  );
};

export default BatteryDisplay;
