from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MetricResponse(BaseModel):
    mae_mw: float = Field(..., description="Mean Absolute Error in MW")
    rmse_mw: float = Field(..., description="Root Mean Square Error in MW")
    mbe_mw: float = Field(..., description="Mean Bias Error in MW (Actual - Forecast)")
    p10_error_mw: float = Field(..., description="10th percentile error in MW (Downside wind deficit risk)")
    p50_error_mw: float = Field(..., description="50th percentile (median) error in MW")
    p90_error_mw: float = Field(..., description="90th percentile error in MW")
    peak_abs_error_mw: float = Field(..., description="Peak single settlement period absolute error in MW")
    mean_actual_mw: float = Field(..., description="Mean actual wind generation in MW")
    max_actual_mw: float = Field(..., description="Peak observed actual wind generation in MW")
    capacity_factor_pct: float = Field(..., description="Calculated capacity factor percentage")
    total_settlement_periods: int = Field(..., description="Number of settlement periods in dataset")

class TimeseriesPoint(BaseModel):
    settlement_period: int
    start_time: str
    actual_generation_mw: float
    forecast_generation_mw: float
    error_mw: float
    abs_error_mw: float
    forecast_publish_time: Optional[str] = None

class TimeseriesResponse(BaseModel):
    date: str
    available_dates: List[str]
    count: int
    day_mae: float
    day_rmse: float
    day_mbe: float
    data: List[TimeseriesPoint]

class ErrorDistributionBucket(BaseModel):
    bin_start: float
    bin_end: float
    bin_label: str
    frequency: int
    density_pct: float

class ErrorDistributionResponse(BaseModel):
    total_samples: int
    mean_error: float
    std_error: float
    p10: float
    p50: float
    p90: float
    buckets: List[ErrorDistributionBucket]

class ProcurementSimRequest(BaseModel):
    date: Optional[str] = Field("2026-01-15", description="Delivery date (YYYY-MM-DD)")
    settlement_period: int = Field(35, ge=1, le=48, description="Target settlement period (1-48, peak is 33-38)")
    consumer_demand_mw: float = Field(18000.0, ge=100.0, le=60000.0, description="Forecasted consumer electricity demand in MW")
    risk_tolerance: str = Field("P50", description="Risk tolerance buffer: 'P50' (median risk) or 'P90' (conservative 90% confidence)")
    custom_buffer_mw: Optional[float] = Field(None, description="Optional manual trader safety buffer in MW")

class ProcurementSimResponse(BaseModel):
    date: str
    settlement_period: int
    time_window: str
    consumer_demand_mw: float
    expected_wind_mw: float
    actual_wind_mw: Optional[float]
    risk_tolerance: str
    applied_safety_buffer_mw: float
    hedged_wind_mw: float
    thermal_procurement_mw: float
    unhedged_exposure_mw: Optional[float]
    imbalance_risk_classification: str
    rationale: str
