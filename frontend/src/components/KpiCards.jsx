import React from 'react';
import { TrendingDown, TrendingUp, AlertTriangle, Gauge, Wind, BarChart3 } from 'lucide-react';

export default function KpiCards({ metrics, loading }) {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-slate-800/40 border border-slate-700/50 animate-pulse p-4" />
        ))}
      </div>
    );
  }

  const isOverForecasting = metrics.mbe_mw < 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* 1. MAE */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
          <span>Mean Absolute Error</span>
          <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-white tracking-tight">
          {metrics.mae_mw.toLocaleString()} <span className="text-xs font-normal text-slate-400">MW</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Avg Day-Ahead volume variance
        </div>
      </div>

      {/* 2. RMSE */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
          <span>Root Mean Square Error</span>
          <Gauge className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-white tracking-tight">
          {metrics.rmse_mw.toLocaleString()} <span className="text-xs font-normal text-slate-400">MW</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Penalizes severe forecast swings
        </div>
      </div>

      {/* 3. MBE */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
          <span>Mean Bias Error (MBE)</span>
          {isOverForecasting ? (
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </div>
        <div className={`text-2xl font-bold font-mono tracking-tight ${isOverForecasting ? 'text-rose-400' : 'text-emerald-400'}`}>
          {metrics.mbe_mw > 0 ? `+${metrics.mbe_mw.toLocaleString()}` : metrics.mbe_mw.toLocaleString()}{' '}
          <span className="text-xs font-normal text-slate-400">MW</span>
        </div>
        <div className="text-[11px] font-medium mt-1">
          {isOverForecasting ? (
            <span className="text-rose-400">Over-forecast (Short Risk)</span>
          ) : (
            <span className="text-emerald-400">Under-forecast (Long Risk)</span>
          )}
        </div>
      </div>

      {/* 4. Downside P10 Buffer */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
          <span>P10 Wind Deficit Buffer</span>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
          {Math.abs(metrics.p10_error_mw).toLocaleString()} <span className="text-xs font-normal text-slate-400">MW</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          90% confidence reserve margin
        </div>
      </div>

      {/* 5. Peak Single-Period Error */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
          <span>Max Single-Period Error</span>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-white tracking-tight">
          {metrics.peak_abs_error_mw.toLocaleString()} <span className="text-xs font-normal text-slate-400">MW</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Worst-case Jan 2026 outturn spike
        </div>
      </div>

      {/* 6. Capacity Factor */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
          <span>Wind Capacity Factor</span>
          <Wind className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-sky-400 tracking-tight">
          {metrics.capacity_factor_pct}%
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Mean: {Math.round(metrics.mean_actual_mw).toLocaleString()} MW
        </div>
      </div>
    </div>
  );
}
