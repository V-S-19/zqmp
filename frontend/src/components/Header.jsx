import React from 'react';
import { Zap, ShieldCheck, Clock, Activity } from 'lucide-react';

export default function Header({ totalPeriods, market = "EPEX SPOT UK / Nord Pool" }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">UK Power Trading Desk</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                January 2026 Pilot
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Day-Ahead Wind Forecast Imbalance Analytics & Thermal Procurement Engine
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Gate Closure:</span>
            <strong className="text-white font-mono">D-1 @ 12:00 UTC</strong>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Zero Lookahead Bias:</span>
            <span className="text-emerald-400 font-medium">Strictly Enforced</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Market:</span>
            <span className="text-slate-200">{market}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
