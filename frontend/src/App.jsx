import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import DateSelector from './components/DateSelector';
import SettlementChart from './components/SettlementChart';
import ProcurementSandbox from './components/ProcurementSandbox';
import ErrorDistributionChart from './components/ErrorDistributionChart';
import { fetchMetrics, fetchTimeseries } from './services/api';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [metrics, setMetrics] = useState(null);
  const [timeseriesResponse, setTimeseriesResponse] = useState(null);
  const [selectedDate, setSelectedDate] = useState('2026-01-01');
  const [selectedPeriod, setSelectedPeriod] = useState(35);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingTimeseries, setLoadingTimeseries] = useState(true);
  const [error, setError] = useState(null);

  // Load global metrics
  useEffect(() => {
    loadGlobalMetrics();
  }, []);

  // Load timeseries on date change
  useEffect(() => {
    loadTimeseries(selectedDate);
  }, [selectedDate]);

  const loadGlobalMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const data = await fetchMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
      setError('Failed to connect to backend API. Please ensure the FastAPI server is running on port 8000.');
    } finally {
      setLoadingMetrics(false);
    }
  };

  const loadTimeseries = async (date) => {
    setLoadingTimeseries(true);
    try {
      const data = await fetchTimeseries(date);
      setTimeseriesResponse(data);
      if (data.available_dates && data.available_dates.length && !data.available_dates.includes(selectedDate)) {
        setSelectedDate(data.available_dates[0]);
      }
    } catch (err) {
      console.error('Failed to load timeseries:', err);
    } finally {
      setLoadingTimeseries(false);
    }
  };

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header totalPeriods={metrics?.total_settlement_periods || 744} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Connection Error Banner */}
        {error && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => { setError(null); loadGlobalMetrics(); loadTimeseries(selectedDate); }}
              className="flex items-center space-x-1 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded text-xs text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 1. Global KPI Header Cards */}
        <section aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="sr-only">Executive Trading Performance KPIs</h2>
          <KpiCards metrics={metrics} loading={loadingMetrics} />
        </section>

        {/* 2. Date Selection & Day Stats Bar */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          availableDates={timeseriesResponse?.available_dates || ['2026-01-01']}
          dayStats={timeseriesResponse ? {
            day_mae: timeseriesResponse.day_mae,
            day_rmse: timeseriesResponse.day_rmse,
            day_mbe: timeseriesResponse.day_mbe
          } : null}
        />

        {/* 3. Day-Ahead Settlement vs Actuals Curve */}
        <section aria-labelledby="chart-heading">
          <SettlementChart
            timeseriesData={timeseriesResponse?.data || []}
            onSelectPeriod={handlePeriodSelect}
            selectedPeriod={selectedPeriod}
          />
        </section>

        {/* 4. Trader Procurement Sandbox Widget */}
        <section aria-labelledby="procurement-heading">
          <ProcurementSandbox
            selectedDate={selectedDate}
            initialPeriod={selectedPeriod}
            p10Buffer={metrics?.p10_error_mw ? Math.abs(metrics.p10_error_mw) : 4000}
          />
        </section>

        {/* 5. Error Distribution & Tail Risk Analysis */}
        <section aria-labelledby="distribution-heading">
          <ErrorDistributionChart />
        </section>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500">
        UK Power Trading Desk Pilot • Elexon BMRS Data Streams (FUELHH & WINDFOR) • Gate Closure: D-1 12:00 UTC
      </footer>
    </div>
  );
}
