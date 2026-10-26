const API_BASE = '/api';

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error(`Metrics API error: ${res.statusText}`);
  return res.json();
}

export async function fetchTimeseries(date = null) {
  const url = date ? `${API_BASE}/timeseries?date=${encodeURIComponent(date)}` : `${API_BASE}/timeseries`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Timeseries API error: ${res.statusText}`);
  return res.json();
}

export async function fetchErrorDistribution(bins = 20) {
  const res = await fetch(`${API_BASE}/error-distribution?bins_count=${bins}`);
  if (!res.ok) throw new Error(`Error Distribution API error: ${res.statusText}`);
  return res.json();
}

export async function simulateProcurement(payload) {
  const res = await fetch(`${API_BASE}/simulate-procurement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Simulation API error: ${res.statusText}`);
  return res.json();
}
