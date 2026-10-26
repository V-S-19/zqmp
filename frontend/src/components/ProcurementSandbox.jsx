import React, { useState, useEffect } from 'react';
import { Sliders, ShieldAlert, Cpu, CheckCircle2, AlertOctagon, Info, ArrowRight } from 'lucide-react';
import { simulateProcurement } from '../services/api';

export default function ProcurementSandbox({ selectedDate, initialPeriod = 35, p10Buffer = 4000 }) {
  const [demandMw, setDemandMw] = useState(18000);
  const [period, setPeriod] = useState(initialPeriod);
  const [riskMode, setRiskMode] = useState('P90'); // 'P50' | 'P90' | 'CUSTOM'
  const [customBuffer, setCustomBuffer] = useState(2500);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPeriod(initialPeriod);
  }, [initialPeriod]);

  useEffect(() => {
    runSimulation();
  }, [selectedDate, period, demandMw, riskMode, customBuffer]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const payload = {
        date: selectedDate,
        settlement_period: Number(period),
        consumer_demand_mw: Number(demandMw),
        risk_tolerance: riskMode === 'CUSTOM' ? 'CUSTOM' : riskMode,
        custom_buffer_mw: riskMode === 'CUSTOM' ? Number(customBuffer) : null,
      };
      const res = await simulateProcurement(payload);
      setResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isPeak = period >= 33 && period <= 38;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded text-orange-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Trader Day-Ahead Procurement Sandbox
            </h2>
            <p className="text-xs text-slate-400">
              Calculate optimal thermal power purchase before 12:00 UTC Day-Ahead gate closure
            </p>
          </div>
        </div>

        {isPeak && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Peak Settlement Window (SP {period})</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Consumer Demand Slider */}
          <div>
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1.5">
              <label htmlFor="demand-slider" className="font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                Consumer Demand Forecast:
              </label>
              <div className="font-mono font-bold text-sky-400 text-sm">
                {demandMw.toLocaleString()} MW
              </div>
            </div>
            <input
              id="demand-slider"
              type="range"
              min="5000"
              max="35000"
              step="500"
              value={demandMw}
              onChange={(e) => setDemandMw(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>5,000 MW (Off-Peak)</span>
              <span>20,000 MW (Winter Base)</span>
              <span>35,000 MW (Extreme Peak)</span>
            </div>
          </div>

          {/* Settlement Period Selector */}
          <div>
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1.5">
              <label htmlFor="sp-select" className="font-medium">Target Settlement Period (SP 1–48):</label>
              <button
                onClick={() => setPeriod(35)}
                className="text-[11px] text-amber-400 hover:underline font-mono"
              >
                Set Peak SP 35 (17:00)
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                id="sp-select"
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white font-mono text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-sky-500"
              >
                {Array.from({ length: 48 }, (_, i) => i + 1).map((sp) => {
                  const hour = Math.floor((sp - 1) / 2);
                  const min = (sp - 1) % 2 === 0 ? '00' : '30';
                  const isSpPeak = sp >= 33 && sp <= 38;
                  return (
                    <option key={sp} value={sp}>
                      SP {sp} ({String(hour).padStart(2, '0')}:{min} UTC) {isSpPeak ? '🔥 PEAK' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Risk Buffer Toggle */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-2">
              Downside Wind Deficit Risk Tolerance:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRiskMode('P50')}
                className={`px-3 py-2 rounded border text-xs font-medium text-center transition ${
                  riskMode === 'P50'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold">P50 Baseline</div>
                <div className="text-[10px] opacity-75">Median Risk</div>
              </button>

              <button
                type="button"
                onClick={() => setRiskMode('P90')}
                className={`px-3 py-2 rounded border text-xs font-medium text-center transition ${
                  riskMode === 'P90'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold">P90 Guard</div>
                <div className="text-[10px] opacity-75">90% Conf. Hedge</div>
              </button>

              <button
                type="button"
                onClick={() => setRiskMode('CUSTOM')}
                className={`px-3 py-2 rounded border text-xs font-medium text-center transition ${
                  riskMode === 'CUSTOM'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold">Custom</div>
                <div className="text-[10px] opacity-75">Trader Input</div>
              </button>
            </div>

            {riskMode === 'CUSTOM' && (
              <div className="mt-2.5">
                <label htmlFor="custom-buffer-input" className="text-[11px] text-slate-400">Manual Error Buffer (MW):</label>
                <input
                  id="custom-buffer-input"
                  type="number"
                  value={customBuffer}
                  onChange={(e) => setCustomBuffer(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 text-white font-mono text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-purple-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Procurement Calculation Breakdown
            </div>

            {result ? (
              <div className="space-y-3 text-xs">
                {/* 1. Demand & Expected Wind */}
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800 font-mono">
                  <div>
                    <span className="text-slate-400 font-sans block text-[11px]">Customer Demand (D):</span>
                    <strong className="text-base text-white">{result.consumer_demand_mw.toLocaleString()} MW</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans block text-[11px]">Day-Ahead Wind Forecast (Ŷ):</span>
                    <strong className="text-base text-sky-400">{result.expected_wind_mw.toLocaleString()} MW</strong>
                  </div>
                </div>

                {/* 2. Buffer Deduction */}
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800 font-mono">
                  <div>
                    <span className="text-slate-400 font-sans block text-[11px]">Safety Buffer Applied:</span>
                    <strong className="text-base text-amber-400">
                      -{result.applied_safety_buffer_mw.toLocaleString()} MW
                    </strong>
                    <span className="text-[10px] text-slate-400 block font-sans">({result.risk_tolerance})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans block text-[11px]">Net Hedged Wind Credit:</span>
                    <strong className="text-base text-emerald-400">{result.hedged_wind_mw.toLocaleString()} MW</strong>
                  </div>
                </div>

                {/* 3. Recommended Thermal Power to Procure */}
                <div className="p-3.5 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <span className="text-orange-400 text-xs font-semibold font-sans block">
                    RECOMMENDED THERMAL POWER TO PROCURE:
                  </span>
                  <div className="text-3xl font-bold font-mono text-orange-400 mt-1">
                    {result.thermal_procurement_mw.toLocaleString()} <span className="text-sm font-normal text-orange-300/80">MW</span>
                  </div>
                  <div className="text-[11px] text-orange-300/80 font-sans mt-1">
                    Formula: Max(0, Demand - Net Hedged Wind) = Max(0, {result.consumer_demand_mw} - {result.hedged_wind_mw})
                  </div>
                </div>

                {/* Outturn Physical Check */}
                {result.actual_wind_mw !== null && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Delivery Outturn Check:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          result.imbalance_risk_classification === 'OPTIMAL HEDGE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : result.imbalance_risk_classification === 'CRITICAL SHORT'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : result.imbalance_risk_classification === 'MILD SHORT'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {result.imbalance_risk_classification}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800">
                      <div>Actual Wind Outturn: <strong className="text-emerald-400">{result.actual_wind_mw.toLocaleString()} MW</strong></div>
                      <div>Net Final Position: <strong className={result.unhedged_exposure_mw < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                        {result.unhedged_exposure_mw > 0 ? `+${result.unhedged_exposure_mw.toLocaleString()}` : result.unhedged_exposure_mw?.toLocaleString()} MW
                        ({result.unhedged_exposure_mw >= 0 ? 'Long' : 'Short'})
                      </strong></div>
                      <p className="text-[11px] font-sans text-slate-400 mt-1 border-t border-slate-800 pt-1">
                        {result.rationale}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                Computing procurement recommendation...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
