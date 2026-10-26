import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { BarChart2, Shield } from 'lucide-react';
import { fetchErrorDistribution } from '../services/api';

const DistributionTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs shadow-xl min-w-[180px]">
      <div className="font-semibold text-white border-b border-slate-800 pb-1">
        Bin: {d.bin_label}
      </div>
      <div className="pt-1.5 space-y-1 font-mono">
        <div className="flex justify-between text-slate-300">
          <span className="font-sans text-slate-400">Frequency:</span>
          <strong>{d.frequency} periods</strong>
        </div>
        <div className="flex justify-between text-sky-400">
          <span className="font-sans text-slate-400">Sample Share:</span>
          <strong>{d.density_pct}%</strong>
        </div>
      </div>
    </div>
  );
};

export default function ErrorDistributionChart() {
  const [distData, setDistData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchErrorDistribution(24)
      .then((data) => setDistData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !distData) {
    return (
      <div className="h-72 bg-slate-900 border border-slate-800 rounded-lg p-5 flex items-center justify-center text-slate-400 text-xs">
        Loading error distribution data...
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-sky-400" />
            January 2026 Forecast Error Distribution (Actual - Day-Ahead Forecast)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical probability distribution of volume errors in MW across all evaluated settlement intervals
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
            Mean Error: <strong className={distData.mean_error < 0 ? 'text-rose-400' : 'text-emerald-400'}>{distData.mean_error > 0 ? `+${distData.mean_error}` : distData.mean_error} MW</strong>
          </span>
          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
            Std Dev: <strong className="text-white">{distData.std_error} MW</strong>
          </span>
        </div>
      </div>

      <div className="h-64 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distData.buckets} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="bin_label"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              interval={2}
              angle={-25}
              textAnchor="end"
              height={40}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{ value: 'Period Count', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
            />
            <Tooltip content={<DistributionTooltip />} />
            <ReferenceLine x="0 MW" stroke="#94a3b8" strokeDasharray="3 3" />
            <Bar dataKey="frequency" name="Settlement Periods" radius={[3, 3, 0, 0]}>
              {distData.buckets.map((entry, index) => {
                const isShort = entry.bin_end <= 0;
                return (
                  <Cell
                    key={`bar-${index}`}
                    fill={isShort ? '#f43f5e' : '#10b981'}
                    opacity={0.8}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs">
        <div className="p-2.5 rounded bg-slate-800/50 border border-slate-700/60 font-mono">
          <div className="text-amber-400 font-sans font-semibold text-[11px] mb-0.5">
            P10 Downside Risk: {distData.p10} MW
          </div>
          <p className="text-[11px] font-sans text-slate-400">
            In 90% of periods, actual wind is within or above this {Math.abs(distData.p10)} MW shortfall limit.
          </p>
        </div>

        <div className="p-2.5 rounded bg-slate-800/50 border border-slate-700/60 font-mono">
          <div className="text-sky-400 font-sans font-semibold text-[11px] mb-0.5">
            P50 Median Bias: {distData.p50} MW
          </div>
          <p className="text-[11px] font-sans text-slate-400">
            Center of the distribution; indicates the baseline forecast offset without storm fat tails.
          </p>
        </div>

        <div className="p-2.5 rounded bg-slate-800/50 border border-slate-700/60 font-mono">
          <div className="text-emerald-400 font-sans font-semibold text-[11px] mb-0.5">
            P90 Upside Wind: +{distData.p90} MW
          </div>
          <p className="text-[11px] font-sans text-slate-400">
            Wind generation surplus tail; high probability of spill or low system sell price (SSP).
          </p>
        </div>
      </div>
    </div>
  );
}
