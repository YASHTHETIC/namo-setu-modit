from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from backend.app.schemas.common import ORMModel


class AnalyticsPeriod(BaseModel):
    days: int = Field(default=30, ge=1, le=365)


class RevenueMetric(BaseModel):
    total: float = 0.0
    growth_pct: float = 0.0
    forecast: list[dict[str, Any]] | None = None


class BookingMetric(BaseModel):
    total: int = 0
    growth_pct: float = 0.0
    by_status: dict[str, int] = Field(default_factory=dict)
    by_date: dict[str, int] = Field(default_factory=dict)


class OrderMetric(BaseModel):
    total: int = 0
    growth_pct: float = 0.0
    by_status: dict[str, int] = Field(default_factory=dict)
    by_date: dict[str, int] = Field(default_factory=dict)


class TempleAnalyticsItem(BaseModel):
    temple_id: str
    temple_name: str
    booking_count: int = 0
    revenue: float = 0.0


class ProductAnalyticsItem(BaseModel):
    product_id: str
    product_name: str
    order_count: int = 0
    revenue: float = 0.0


class NamoAnalyticsResponse(BaseModel):
    revenue: RevenueMetric
    bookings: BookingMetric
    donations_total: float = 0.0
    donations_growth_pct: float = 0.0
    temples_active: int = 0
    users_new: int = 0
    top_temples: list[TempleAnalyticsItem] = Field(default_factory=list)
    avg_booking_value: float = 0.0
    conversion_rate: float = 0.0
    insights: list[str] = Field(default_factory=list)


class ModitAnalyticsResponse(BaseModel):
    revenue: RevenueMetric
    orders: OrderMetric
    suppliers_active: int = 0
    rfqs_pending: int = 0
    inventory_value: float = 0.0
    top_products: list[ProductAnalyticsItem] = Field(default_factory=list)
    avg_order_value: float = 0.0
    rfq_conversion_rate: float = 0.0
    insights: list[str] = Field(default_factory=list)


class RevenueForecast(BaseModel):
    product_code: str
    monthly_forecasts: list[dict[str, Any]] = Field(default_factory=list)
    trend: str = "stable"
    confidence: float = 0.0


class HeatmapDataPoint(BaseModel):
    city: str
    state: str
    latitude: float | None = None
    longitude: float | None = None
    count: int = 0
    value: float = 0.0


class HeatmapData(BaseModel):
    points: list[HeatmapDataPoint] = Field(default_factory=list)
    aggregate_by: str = "city"
    total_count: int = 0


class GrowthMetrics(BaseModel):
    period_days: int = 30
    user_growth: dict[str, Any] = Field(default_factory=dict)
    revenue_growth: dict[str, Any] = Field(default_factory=dict)
    booking_growth: dict[str, Any] = Field(default_factory=dict)
    order_growth: dict[str, Any] = Field(default_factory=dict)


class AnomalyItem(BaseModel):
    metric: str
    value: float
    expected_range: tuple[float, float]
    severity: str = "low"
    description: str = ""


class AIInsights(BaseModel):
    product_code: str
    insights: list[str] = Field(default_factory=list)
    anomalies: list[AnomalyItem] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class ExportRequest(BaseModel):
    format: str = Field(..., pattern="^(pdf|excel)$")
    data: dict[str, Any] = Field(default_factory=dict)
    title: str = "Analytics Report"
