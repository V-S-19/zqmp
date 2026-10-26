/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        desk: {
          bg: '#0f172a',        // slate-900
          card: '#1e293b',      // slate-800
          border: '#334155',    // slate-700
          accent: '#0284c7',    // sky-600
          wind: '#06b6d4',      // cyan-500
          actual: '#10b981',    // emerald-500
          forecast: '#38bdf8',  // sky-400
          short: '#ef4444',     // red-500
          long: '#f59e0b',      // amber-500
          thermal: '#f97316',   // orange-500
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
