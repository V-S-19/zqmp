import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DateSelector({ selectedDate, onDateChange, availableDates, dayStats }) {
  const currentIndex = availableDates.indexOf(selectedDate);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < availableDates.length - 1;

  const handlePrev = () => {
    if (hasPrev) onDateChange(availableDates[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onDateChange(availableDates[currentIndex + 1]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Date controls */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 mr-2">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span>Delivery Date:</span>
        </div>

        <button
          onClick={handlePrev}
          disabled={!hasPrev}
          aria-label="Previous day"
          className="p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <select
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white font-mono text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
        >
          {availableDates.map((dateStr) => (
            <option key={dateStr} value={dateStr}>
              {dateStr} ({new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })})
            </option>
          ))}
        </select>

        <button
          onClick={handleNext}
          disabled={!hasNext}
          aria-label="Next day"
          className="p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day stats badge */}
      {dayStats && (
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <span className="text-slate-400 font-sans mr-1.5">Day MAE:</span>
            <strong className="text-white">{dayStats.day_mae?.toLocaleString()} MW</strong>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <span className="text-slate-400 font-sans mr-1.5">Day RMSE:</span>
            <strong className="text-white">{dayStats.day_rmse?.toLocaleString()} MW</strong>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <span className="text-slate-400 font-sans mr-1.5">Day MBE:</span>
            <strong className={dayStats.day_mbe < 0 ? 'text-rose-400' : 'text-emerald-400'}>
              {dayStats.day_mbe > 0 ? `+${dayStats.day_mbe}` : dayStats.day_mbe} MW
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
