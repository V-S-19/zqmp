# UK Energy Trading Desk: Wind Imbalance & Procurement Analytics

Production-grade pilot analytics and thermal power procurement decision support engine for a UK wholesale electricity trading desk operating on **EPEX SPOT UK** and **Nord Pool**.

Designed to optimize Day-Ahead thermal procurement decisions against volatile wind generation and eliminate costly imbalance cash-out penalties under the British Balancing and Settlement Code (BSC / Elexon P305).

---

## 1. Executive Summary & Market Problem Statement

UK energy utilities serving consumer demand face significant financial penalties if physical supply deviates from contracted demand at gate closure:
1. **Thermal Procurement Formula**:
   $$\text{Thermal Power to Procure} = \text{Forecasted Demand} - \text{Available Renewable (Wind) Generation}$$
2. **Gate Closure & Zero Lookahead Bias**:
   - Power purchase decisions for delivery day $D$ must be finalized on Day $D-1$ before Day-Ahead market gate closure (typically 11:00 AM / 12:00 PM UK time).
   - Any forecast published after $D-1$ 12:00:00 UTC constitutes **lookahead bias** and is strictly prohibited in trading backtests.
3. **Imbalance Settlement Risk**:
   - Physical deficits (short positions) during evening peak periods (Settlement Periods 33–38, 16:30–19:30 UTC) are cashed out at the **System Buy Price (SBP)**, which regularly spikes from £250/MWh to over £1,000/MWh when grid margins tighten.
   - Physical surpluses (long positions) are liquidated at the **System Sell Price (SSP)**, destroying margins through spill discount.

---

## 2. Mathematical & Quantitative Framework (Section A)

For $N = 31 \times 48 = 1,488$ discrete 30-minute settlement periods across January 2026:
- $A_t$: Actual wind generation (MW) from Elexon BMRS `FUELHH` (`fuelType == "WIND"`).
- $\hat{Y}_t$: Day-Ahead wind forecast (MW) from `WINDFOR` with $\tau_{\text{pub}} \le D-1\text{ 12:00:00 UTC}$.
- Error residual: $e_t = A_t - \hat{Y}_t$ [MW].

### Error Formulas
- **Mean Absolute Error (MAE)**:
  $$\text{MAE} = \frac{1}{N} \sum_{t=1}^{N} |A_t - \hat{Y}_t| \quad [\text{MW}]$$
- **Root Mean Square Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{t=1}^{N} (A_t - \hat{Y}_t)^2} \quad [\text{MW}]$$
- **Mean Bias Error (MBE)**:
  $$\text{MBE} = \frac{1}{N} \sum_{t=1}^{N} (A_t - \hat{Y}_t) \quad [\text{MW}]$$
  - $\text{MBE} < 0 \implies$ Over-forecasting wind $\implies$ Desk arrives **short** at gate closure.
  - $\text{MBE} > 0 \implies$ Under-forecasting wind $\implies$ Desk arrives **long** at gate closure.
- **Percentile Error Buffers ($P_{10}, P_{50}, P_{90}$)**:
  - $P_{10}$: Downside 10th percentile error residual. In 90% of intervals, actual wind outturn meets or exceeds $\hat{Y}_t + P_{10}$.
  - Safety Buffer applied: $|P_{10}|$ for a conservative 90% confidence hedge.

### Imbalance Cash-out Impact (Peak Evening Hours: SP 33–38)
Under the UK BSC single cash-out price mechanism (P305), peaker plants (OCGTs and flexible gas engines) set marginal BM offer prices during winter evening peak demand (16:30–19:30 UTC). 

If a trading desk has **negative forecast bias** (over-forecasting wind), it under-buys thermal generation in the Day-Ahead auction. The resulting deficit is settled at punitive peak System Buy Prices ($SBP_t \gg P_{\text{DayAhead}}$), triggering severe trading losses. Conversely, if the desk has **positive forecast bias** (under-forecasting wind), it over-buys thermal generation in the auction; the surplus spills into the balancing mechanism and is cashed out at a steep discount ($SSP_t \ll P_{\text{DayAhead}}$), causing thermal fuel burn losses.

---

## 3. Project Architecture (Section B & C)

```
GrideBrick/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py         # SQLite connection with SQLAlchemy
│   │   ├── models.py           # ORM models for settlement records & metrics
│   │   ├── schemas.py          # Pydantic v2 validation models
│   │   └── main.py             # FastAPI REST endpoints & SPA static mounting
│   ├── pipeline/
│   │   ├── __init__.py
│   │   └── fetch_and_process.py# Elexon BMRS ingestion with zero lookahead bias
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx              # Status, market badges & rule indicators
│   │   │   ├── KpiCards.jsx            # MAE, RMSE, MBE, P10 buffer, Peak error
│   │   │   ├── DateSelector.jsx        # Jan 2026 day navigation & day stats
│   │   │   ├── SettlementChart.jsx     # Recharts dual-line + imbalance bars
│   │   │   ├── ProcurementSandbox.jsx  # Demand slider, P50/P90 hedge simulator
│   │   │   └── ErrorDistributionChart.jsx # Error histogram & percentile lines
│   │   ├── services/
│   │   │   └── api.js                  # Frontend REST API client
│   │   ├── App.jsx                     # Main application layout
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── data/
│   └── energy_trading.db       # SQLite database with Jan 2026 settlement records
├── Dockerfile                  # Multi-stage production container build
├── docker-compose.yml          # Container orchestration with volume persistence
└── README.md
```

### FastAPI Endpoints
- `GET /api/health`: Health status and market metadata.
- `GET /api/metrics`: Global January 2026 KPIs (MAE, RMSE, MBE, P10, P50, P90, Capacity Factor).
- `GET /api/timeseries?date=YYYY-MM-DD`: 30-min settlement intervals, actuals, forecasts, and delta errors.
- `GET /api/error-distribution?bins_count=20`: Histogram buckets of forecast error with distribution stats.
- `POST /api/simulate-procurement`: Trader procurement sandbox recommendation engine based on user demand and risk tolerance (P50/P90/Custom).

---

## 4. Quick Start & Local Execution

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Docker (optional for containerized deployment)

### Option A: Running with Docker (Recommended)
```bash
# Build and run with single command
docker-compose up --build

# Access the application in your browser:
# http://localhost:8000
```

### Option B: Running Locally (Development Mode)

#### 1. Setup Backend
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# (Optional) Run the live BMRS data ingestion pipeline
python backend/pipeline/fetch_and_process.py

# Start the FastAPI server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
# Vite runs on http://localhost:5173 with automatic backend proxying
```

---

## 5. Deployment Guide (Section D)

### 1. Render Deployment
1. Connect this GitHub repository to Render as a **Web Service**.
2. Select **Docker** as the runtime.
3. Configure Environment Variables:
   - `PORT=8000`
4. Set Health Check path: `/api/health`.

### 2. Heroku Deployment
```bash
# Login to Heroku Container Registry
heroku container:login

# Create app and push container
heroku create uk-energy-trading-desk
heroku container:push web -a uk-energy-trading-desk
heroku container:release web -a uk-energy-trading-desk
```

### 3. Vercel Deployment (Frontend decoupled)
1. Point root directory to `frontend/`.
2. Set Build Command: `npm run build`.
3. Set Output Directory: `dist`.
4. Configure environment variable `VITE_API_BASE_URL` pointing to the deployed FastAPI backend.

---

## 6. AI Usage & Verification Disclosure (Section E)

In accordance with institutional software governance and quantitative validation standards:
- **Domain & Mathematical Research**: Formulated with assistance from Anthropic Claude for energy economics, UK BSC balancing mechanism single cash-out dynamics (P305), and mathematical percentile error formulations.
- **Agentic Implementation & Code Generation**: Implemented, verified, and orchestrated autonomously using **Google Antigravity**, executing live API streams against the Elexon BMRS platform, database schema migrations, and frontend component construction.
- **Verification**: Zero lookahead bias verified against strict temporal gate-closure constraints ($\tau_{\text{pub}} \le D-1\text{ 12:00:00 UTC}$). All API endpoints and build artifacts tested and validated.
