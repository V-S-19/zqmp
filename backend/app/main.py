import os
import math
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db, engine, Base
from backend.app.models import SettlementRecord, MetricRecord
from backend.app.schemas import (
    MetricResponse,
    TimeseriesResponse,
    TimeseriesPoint,
    ErrorDistributionResponse,
    ErrorDistributionBucket,
    ProcurementSimRequest,
    ProcurementSimResponse
)

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="UK Energy Trading Desk - Wind Forecast & Imbalance Analytics",
    description="Production-grade pilot analytics and thermal procurement decision engine for UK Day-Ahead power trading.",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "market": "UK Wholesale Electricity (EPEX SPOT UK / Nord Pool)",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/metrics", response_model=MetricResponse)
def get_metrics(db: Session = Depends(get_db)):
    """Returns global January 2026 performance KPIs."""
    metric_rows = db.query(MetricRecord).all()
    if not metric_rows:
        # Fallback query directly from settlement records
        count = db.query(SettlementRecord).count()
        if count == 0:
            raise HTTPException(status_code=404, detail="No settlement records found. Run the ingestion pipeline first.")
        
        errors = [r.error_mw for r in db.query(SettlementRecord.error_mw).all()]
        abs_errors = [r.abs_error_mw for r in db.query(SettlementRecord.abs_error_mw).all()]
        actuals = [r.actual_generation_mw for r in db.query(SettlementRecord.actual_generation_mw).all()]
        
        mae = float(np.mean(abs_errors))
        rmse = float(np.sqrt(np.mean(np.array(errors)**2)))
        mbe = float(np.mean(errors))
        p10 = float(np.percentile(errors, 10))
        p50 = float(np.percentile(errors, 50))
        p90 = float(np.percentile(errors, 90))
        peak_err = float(np.max(abs_errors))
        mean_act = float(np.mean(actuals))
        max_act = float(np.max(actuals))
        cf = (mean_act / max_act * 100.0) if max_act > 0 else 0.0

        return MetricResponse(
            mae_mw=round(mae, 2),
            rmse_mw=round(rmse, 2),
            mbe_mw=round(mbe, 2),
            p10_error_mw=round(p10, 2),
            p50_error_mw=round(p50, 2),
            p90_error_mw=round(p90, 2),
            peak_abs_error_mw=round(peak_err, 2),
            mean_actual_mw=round(mean_act, 2),
            max_actual_mw=round(max_act, 2),
            capacity_factor_pct=round(cf, 2),
            total_settlement_periods=count
        )

    m = {r.metric_key: r.metric_value for r in metric_rows}
    return MetricResponse(
        mae_mw=m.get("MAE_MW", 0.0),
        rmse_mw=m.get("RMSE_MW", 0.0),
        mbe_mw=m.get("MBE_MW", 0.0),
        p10_error_mw=m.get("P10_ERROR_MW", 0.0),
        p50_error_mw=m.get("P50_ERROR_MW", 0.0),
        p90_error_mw=m.get("P90_ERROR_MW", 0.0),
        peak_abs_error_mw=m.get("PEAK_ABS_ERROR_MW", 0.0),
        mean_actual_mw=m.get("MEAN_ACTUAL_MW", 0.0),
        max_actual_mw=m.get("MAX_ACTUAL_MW", 0.0),
        capacity_factor_pct=m.get("CAPACITY_FACTOR_PCT", 0.0),
        total_settlement_periods=int(m.get("TOTAL_SETTLEMENT_PERIODS", 0))
    )

@app.get("/api/timeseries", response_model=TimeseriesResponse)
def get_timeseries(
    date: Optional[str] = Query(None, description="Settlement date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    """Returns settlement periods for a given date, plus list of all available January 2026 dates."""
    # Query distinct available dates
    available_dates = [
        d[0] for d in db.query(SettlementRecord.settlement_date).distinct().order_by(SettlementRecord.settlement_date).all()
    ]

    if not available_dates:
        raise HTTPException(status_code=404, detail="No settlement data available.")

    selected_date = date if date in available_dates else available_dates[0]

    records = (
        db.query(SettlementRecord)
        .filter(SettlementRecord.settlement_date == selected_date)
        .order_by(SettlementRecord.settlement_period)
        .all()
    )

    if not records:
        raise HTTPException(status_code=404, detail=f"No records found for date {selected_date}")

    data_points = []
    errors = []
    abs_errors = []

    for r in records:
        errors.append(r.error_mw)
        abs_errors.append(r.abs_error_mw)
        data_points.append(TimeseriesPoint(
            settlement_period=r.settlement_period,
            start_time=r.start_time.strftime("%H:%M"),
            actual_generation_mw=round(r.actual_generation_mw, 1),
            forecast_generation_mw=round(r.forecast_generation_mw, 1),
            error_mw=round(r.error_mw, 1),
            abs_error_mw=round(r.abs_error_mw, 1),
            forecast_publish_time=r.forecast_publish_time.strftime("%Y-%m-%d %H:%M UTC") if r.forecast_publish_time else None
        ))

    day_mae = float(np.mean(abs_errors)) if abs_errors else 0.0
    day_rmse = float(np.sqrt(np.mean(np.array(errors)**2))) if errors else 0.0
    day_mbe = float(np.mean(errors)) if errors else 0.0

    return TimeseriesResponse(
        date=selected_date,
        available_dates=available_dates,
        count=len(data_points),
        day_mae=round(day_mae, 1),
        day_rmse=round(day_rmse, 1),
        day_mbe=round(day_mbe, 1),
        data=data_points
    )

@app.get("/api/error-distribution", response_model=ErrorDistributionResponse)
def get_error_distribution(
    bins_count: int = Query(20, ge=5, le=50),
    db: Session = Depends(get_db)
):
    """Generates histogram buckets of the forecast error (Actual - Forecast) in MW."""
    records = db.query(SettlementRecord.error_mw).all()
    if not records:
        raise HTTPException(status_code=404, detail="No settlement records found.")

    errors = np.array([r[0] for r in records])
    n = len(errors)
    mean_err = float(np.mean(errors))
    std_err = float(np.std(errors))
    p10 = float(np.percentile(errors, 10))
    p50 = float(np.percentile(errors, 50))
    p90 = float(np.percentile(errors, 90))

    counts, bin_edges = np.histogram(errors, bins=bins_count)
    buckets = []

    for i in range(len(counts)):
        b_start = round(float(bin_edges[i]), 1)
        b_end = round(float(bin_edges[i+1]), 1)
        freq = int(counts[i])
        density = round((freq / n) * 100.0, 2)
        buckets.append(ErrorDistributionBucket(
            bin_start=b_start,
            bin_end=b_end,
            bin_label=f"{b_start:+} to {b_end:+} MW",
            frequency=freq,
            density_pct=density
        ))

    return ErrorDistributionResponse(
        total_samples=n,
        mean_error=round(mean_err, 2),
        std_error=round(std_err, 2),
        p10=round(p10, 2),
        p50=round(p50, 2),
        p90=round(p90, 2),
        buckets=buckets
    )

@app.post("/api/simulate-procurement", response_model=ProcurementSimResponse)
def simulate_procurement(
    req: ProcurementSimRequest,
    db: Session = Depends(get_db)
):
    """
    Trader Procurement Sandbox:
    Given consumer demand and target delivery slot (Settlement Period), computes
    the recommended Day-Ahead Thermal Power to Procure with explicit risk buffers:
      - Risk-Neutral (P50): Accounts for median forecast deviation
      - Risk-Averse (P90): Reserves safety margin based on P10 wind deficit threshold
    """
    record = (
        db.query(SettlementRecord)
        .filter(
            SettlementRecord.settlement_date == req.date,
            SettlementRecord.settlement_period == req.settlement_period
        )
        .first()
    )

    # If exact period not found, take closest or average for that period
    if not record:
        record = (
            db.query(SettlementRecord)
            .filter(SettlementRecord.settlement_period == req.settlement_period)
            .first()
        )

    expected_wind = record.forecast_generation_mw if record else 10000.0
    actual_wind = record.actual_generation_mw if record else None

    # Fetch global metrics for percentile buffers
    all_errors = [r[0] for r in db.query(SettlementRecord.error_mw).all()]
    if all_errors:
        p10_error = float(np.percentile(all_errors, 10))
        p50_error = float(np.percentile(all_errors, 50))
    else:
        p10_error = -3500.0
        p50_error = -1500.0

    # Determine Safety Buffer (MW)
    # Wind Deficit Risk: Error = Actual - Forecast. If Actual < Forecast, Error is negative.
    # To be 90% confident that wind >= hedged volume, hedge = Forecast + P10 (where P10 is negative, so buffer = |P10|)
    if req.custom_buffer_mw is not None:
        buffer_mw = req.custom_buffer_mw
        risk_mode = "Custom"
    elif req.risk_tolerance.upper() == "P90":
        # 90% confidence against wind shortfall: buffer = |P10_error|
        buffer_mw = abs(p10_error)
        risk_mode = "P90 (Conservative 90% Confidence)"
    else:
        # P50: median adjustment (if negative bias, compensate by |P50|)
        buffer_mw = abs(p50_error) if p50_error < 0 else 0.0
        risk_mode = "P50 (Median Central Hedge)"

    # Effective hedged wind capacity
    hedged_wind = max(0.0, expected_wind - buffer_mw)
    thermal_procurement = max(0.0, req.consumer_demand_mw - hedged_wind)

    # Outturn evaluation if actual wind is known
    unhedged_exposure = None
    imbalance_risk = "LOW"
    rationale = ""

    if actual_wind is not None:
        actual_total_procured = thermal_procurement + actual_wind
        unhedged_exposure = actual_total_procured - req.consumer_demand_mw  # Positive = Long, Negative = Short

        if unhedged_exposure < -500:
            imbalance_risk = "CRITICAL SHORT"
            rationale = (
                f"Deficit of {abs(unhedged_exposure):.1f} MW into gate closure! "
                f"Desk exposed to peak System Buy Price (SBP) cash-out penalties."
            )
        elif unhedged_exposure < 0:
            imbalance_risk = "MILD SHORT"
            rationale = (
                f"Minor deficit of {abs(unhedged_exposure):.1f} MW. "
                f"Acceptable balance, but minor SBP cash-out settlement required."
            )
        elif unhedged_exposure > 1500:
            imbalance_risk = "OVER-HEDGED LONG"
            rationale = (
                f"Long position of +{unhedged_exposure:.1f} MW. Excess thermal power procured will "
                f"spill into system at discount System Sell Price (SSP)."
            )
        else:
            imbalance_risk = "OPTIMAL HEDGE"
            rationale = (
                f"Clean hedge within optimal tolerance (+{unhedged_exposure:.1f} MW balance). "
                f"Thermal procurement accurately covered customer load."
            )
    else:
        rationale = f"Recommended thermal purchase based on {risk_mode} buffer of {buffer_mw:.1f} MW."

    time_str = f"SP {req.settlement_period} ({record.start_time.strftime('%H:%M') if record else 'N/A'})"

    return ProcurementSimResponse(
        date=req.date or "2026-01-15",
        settlement_period=req.settlement_period,
        time_window=time_str,
        consumer_demand_mw=round(req.consumer_demand_mw, 1),
        expected_wind_mw=round(expected_wind, 1),
        actual_wind_mw=round(actual_wind, 1) if actual_wind is not None else None,
        risk_tolerance=risk_mode,
        applied_safety_buffer_mw=round(buffer_mw, 1),
        hedged_wind_mw=round(hedged_wind, 1),
        thermal_procurement_mw=round(thermal_procurement, 1),
        unhedged_exposure_mw=round(unhedged_exposure, 1) if unhedged_exposure is not None else None,
        imbalance_risk_classification=imbalance_risk,
        rationale=rationale
    )

# Static files for frontend build in production
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
