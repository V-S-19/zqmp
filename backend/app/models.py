from sqlalchemy import Column, Integer, Float, String, DateTime, Index
from datetime import datetime
from backend.app.database import Base

class SettlementRecord(Base):
    __tablename__ = "settlement_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    start_time = Column(DateTime, nullable=False, index=True)
    settlement_date = Column(String(10), nullable=False, index=True)
    settlement_period = Column(Integer, nullable=False)
    actual_generation_mw = Column(Float, nullable=False)
    forecast_generation_mw = Column(Float, nullable=False)
    error_mw = Column(Float, nullable=False)
    abs_error_mw = Column(Float, nullable=False)
    forecast_publish_time = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_date_period", "settlement_date", "settlement_period"),
    )

class MetricRecord(Base):
    __tablename__ = "summary_metrics"

    metric_key = Column(String(50), primary_key=True)
    metric_value = Column(Float, nullable=False)
    description = Column(String(200), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)
