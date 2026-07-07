from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import require_permission
from backend.app.core.database import get_db
from backend.app.core.rbac import PermissionName
from backend.app.schemas.analytics import (
    AIInsights,
    AnalyticsPeriod,
    ExportRequest,
    GrowthMetrics,
    HeatmapData,
    NamoAnalyticsResponse,
    ModitAnalyticsResponse,
    RevenueForecast,
)
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get(
    "/analytics/namo",
    response_model=NamoAnalyticsResponse,
    dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))],
    summary="Namo Setu analytics dashboard",
)
async def get_namo_analytics(
    period_days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
) -> NamoAnalyticsResponse:
    data = await AnalyticsService.get_namo_analytics(db, period_days=period_days)
    return NamoAnalyticsResponse(
        revenue=data["revenue"],
        bookings=data["bookings"],
        donations_total=data["donations_total"],
        donations_growth_pct=data["donations_growth_pct"],
        temples_active=data["temples_active"],
        users_new=data["users_new"],
        top_temples=data["top_temples"],
        avg_booking_value=data["avg_booking_value"],
        conversion_rate=data["conversion_rate"],
        insights=[],
    )


@router.get(
    "/analytics/modit",
    response_model=ModitAnalyticsResponse,
    dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))],
    summary="MODIT analytics dashboard",
)
async def get_modit_analytics(
    period_days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
) -> ModitAnalyticsResponse:
    data = await AnalyticsService.get_modit_analytics(db, period_days=period_days)
    return ModitAnalyticsResponse(
        revenue=data["revenue"],
        orders=data["orders"],
        suppliers_active=data["suppliers_active"],
        rfqs_pending=data["rfqs_pending"],
        inventory_value=data["inventory_value"],
        top_products=data["top_products"],
        avg_order_value=data["avg_order_value"],
        rfq_conversion_rate=data["rfq_conversion_rate"],
        insights=[],
    )


@router.get(
    "/analytics/revenue-forecast",
    response_model=RevenueForecast,
    dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))],
    summary="Revenue forecast using linear regression",
)
async def get_revenue_forecast(
    product_code: str = Query(..., description="namo_setu or modit"),
    months: int = Query(default=6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
) -> RevenueForecast:
    data = await AnalyticsService.get_revenue_forecast(db, product_code, months=months)
    return RevenueForecast(**data)


@router.get(
    "/analytics/heatmap",
    response_model=HeatmapData,
    dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))],
    summary="Geographic heatmap data",
)
async def get_heatmap(
    product_code: str = Query(..., description="namo_setu or modit"),
    entity_type: str = Query(default="bookings", description="bookings, donations, or orders"),
    db: AsyncSession = Depends(get_db),
) -> HeatmapData:
    data = await AnalyticsService.get_heatmap_data(db, product_code, entity_type=entity_type)
    return HeatmapData(**data)


@router.get(
    "/analytics/growth",
    response_model=GrowthMetrics,
    dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))],
    summary="Growth metrics with month-over-month comparisons",
)
async def get_growth(
    product_code: str = Query(..., description="namo_setu or modit"),
    period_days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
) -> GrowthMetrics:
    data = await AnalyticsService.get_growth_metrics(db, product_code, period_days=period_days)
    return GrowthMetrics(**data)


@router.get(
    "/analytics/insights",
    response_model=AIInsights,
    dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))],
    summary="AI-driven insights and anomaly detection",
)
async def get_insights(
    product_code: str = Query(..., description="namo_setu or modit"),
    db: AsyncSession = Depends(get_db),
) -> AIInsights:
    data = await AnalyticsService.get_ai_insights(db, product_code)
    return AIInsights(**data)


@router.post(
    "/analytics/export",
    dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))],
    summary="Export analytics report as PDF or Excel",
    response_class=Response,
)
async def export_report(
    payload: ExportRequest,
    db: AsyncSession = Depends(get_db),
) -> Response:
    if payload.format == "pdf":
        data = payload.data
        content = AnalyticsService.export_pdf(data, title=payload.title)
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={payload.title}.pdf"},
        )
    else:
        data = payload.data
        content = AnalyticsService.export_excel(data, title=payload.title)
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={payload.title}.xlsx"},
        )
