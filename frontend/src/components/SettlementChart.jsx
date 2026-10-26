import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  Cell
} from 'recharts';
import { HelpCircle, Eye, EyeOff } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const isPeak = data.settlement_period >= 33 && data.settlement_period <= 38;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs space-y-1.5 min-w-[210px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <span className="font-bold text-white">
          SP {data.settlement_period} ({data.start_time})
        </span>
        {isPeak && (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
            EVENING PEAK
          </span>
        )}
      </div>

      <div className="space-y-1 pt-1 font-mono">
        <div className="flex justify-between items-center text-emerald-400">
          <span className="font-sans text-slate-400">Actual Outturn:</span>
          <strong>{data.actual_generation_mw?.toLocaleString()} MW</strong>
        </div>

        <div className="flex justify-between items-center text-sky-400">
          <span className="font-sans text-slate-400">Day-Ahead Fcst:</span>
          <strong>{data.forecast_generation_mw?.toLocaleString()} MW</strong>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-slate-800">
          <span className="font-sans text-slate-400">Imbalance Delta:</span>
          <strong className={data.error_mw < 0 ? 'text-rose-400' : 'text-emerald-400'}>
            {data.error_mw > 0 ? `+${data.error_mw.toLocaleString()}` : data.error_mw?.toLocaleString()} MW
          </strong>
        </div>
      </div>

      {data.forecast_publish_time && (
        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 font-sans">
          Forecast published: {data.forecast_publish_time}
        </div>
      )}
    </div>
  );
};

export default function SettlementChart({ timeseriesData, onSelectPeriod, selectedPeriod }) {
  const [showDelta, setShowDelta] = useState(true);

  if (!timeseriesData || !timeseriesData.length) {
    return (
      <div className="h-80 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400">
        No settlement data available for selected date.
      </div>
    );
  }

  // Format data for chart
  const chartData = timeseriesData.map((d) => ({
    ...d,
    time_label: `SP${d.settlement_period} (${d.start_time})`,
  }));

  // Identify peak period start & end labels for ReferenceArea
  const peakStart = chartData.find((d) => d.settlement_period === 33)?.time_label;
  const peakEnd = chartData.find((d) => d.settlement_period === 38)?.time_label;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            Day-Ahead Settlement Curve vs Outturn Actuals
            <span className="text-xs font-normal text-slate-400 font-sans">
              (Click any period to test in Procurement Sandbox)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates wind generation across 30-min settlement intervals. Shaded region indicates high-risk UK Peak Evening Hours (SP 33–38).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDelta(!showDelta)}
            className="flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            {showDelta ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-sky-400" />}
            <span>{showDelta ? 'Hide Delta Bars' : 'Show Delta Bars'}</span>
          </button>
        </div>
      </div>

      <div className="h-96 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload[0]) {
                const sp = state.activePayload[0].payload.settlement_period;
                if (onSelectPeriod) onSelectPeriod(sp);
              }
            }}
            margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="time_label"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval="preserveStartEnd"
              angle={-30}
              textAnchor="end"
              height={45}
            />

            {/* Left Axis: Generation (MW) */}
            <YAxis
              yAxisId="generation"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              label={{ value: 'Generation (MW)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
            />

            {/* Right Axis: Imbalance Delta (MW) */}
            {showDelta && (
              <YAxis
                yAxisId="delta"
                orientation="right"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(1)}k`}
                label={{ value: 'Imbalance Delta (MW)', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 11 }}
              />
            )}

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
            />

            {/* Peak Evening Hours Shading (SP 33 - 38) */}
            {peakStart && peakEnd && (
              <ReferenceArea
                yAxisId="generation"
                x1={peakStart}
                x2={peakEnd}
                fill="#f59e0b"
                fillOpacity={0.08}
                stroke="#f59e0b"
                strokeOpacity={0.3}
                strokeDasharray="2 2"
              />
            )}

            <ReferenceLine yAxisId="delta" y={0} stroke="#475569" strokeDasharray="2 2" />

            {/* Actual Outturn Line */}
            <Line
              yAxisId="generation"
              type="monotone"
              dataKey="actual_generation_mw"
              name="Actual Outturn (MW)"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: '#10b981' }}
              activeDot={{ r: 6, fill: '#34d399' }}
            />

            {/* Day-Ahead Forecast Line */}
            <Line
              yAxisId="generation"
              type="monotone"
              dataKey="forecast_generation_mw"
              name="Day-Ahead Forecast (MW)"
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 2, fill: '#38bdf8' }}
              activeDot={{ r: 5, fill: '#7dd3fc' }}
            />

            {/* Delta Bar */}
            {showDelta && (
              <Bar
                yAxisId="delta"
                dataKey="error_mw"
                name="Imbalance Delta (Actual - Forecast)"
                opacity={0.75}
                barSize={10}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.error_mw < 0 ? '#f43f5e' : '#10b981'}
                  />
                ))}
              </Bar>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 mt-2 px-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Actual Outturn</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 bg-sky-400 inline-block border-t border-dashed" />
            <span>Day-Ahead Forecast</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded bg-rose-500 inline-block" />
            <span>Short Imbalance (Deficit)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded bg-emerald-500 inline-block" />
            <span>Long Imbalance (Surplus)</span>
          </span>
        </div>

        <div className="flex items-center space-x-1 text-amber-400/90 font-medium">
          <span>SP 33–38 Shaded: UK Winter Peak (16:30–19:30 UTC)</span>
        </div>
      </div>
    </div>
  );
}
