"""HTTP endpoints that return wind data to the frontend."""

from datetime import date
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.services import analysis, elexon

router = APIRouter(prefix="/api")


async def get_raw_data() -> tuple[list[dict], list[dict]]:
    """Fetch actuals and forecasts from Elexon.

    Raises a 502 error if Elexon cannot be reached.
    """
    try:
        actuals = await elexon.fetch_actuals()
        forecasts = await elexon.fetch_forecasts()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not fetch data from Elexon")

    return actuals, forecasts


async def get_aligned_data() -> list[dict]:
    """Fetch the data and match each actual with its forecast.

    Uses the day-ahead rule (forecasts at least 24 hours old) from
    analysis.align_data.
    """
    actuals, forecasts = await get_raw_data()
    return analysis.align_data(actuals, forecasts)


@router.get("/health")
async def health():
    """Simple check that the server is running."""
    return {"status": "ok"}


@router.get("/actuals")
async def get_actuals(refresh: bool = False):
    """Return actual wind generation for January 2026.

    Add ?refresh=true to ignore the cache and fetch fresh data.
    """
    try:
        return await elexon.fetch_actuals(force_refresh=refresh)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not fetch actuals from Elexon")


@router.get("/forecasts")
async def get_forecasts(refresh: bool = False):
    """Return wind generation forecasts for January 2026.

    Add ?refresh=true to ignore the cache and fetch fresh data.
    """
    try:
        return await elexon.fetch_forecasts(force_refresh=refresh)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not fetch forecasts from Elexon")


@router.get("/comparison")
async def get_comparison(aggregation: Literal["all", "daily"] = "all"):
    """Return forecast vs actual for every period, or averaged per day."""
    aligned = await get_aligned_data()

    if aggregation == "daily":
        return analysis.daily_comparison(aligned)
    return aligned


@router.get("/metrics")
async def get_metrics():
    """Return overall error metrics for the whole month."""
    aligned = await get_aligned_data()
    return analysis.compute_metrics(aligned)


@router.get("/metrics/daily")
async def get_daily_metrics():
    """Return error metrics for each calendar day."""
    aligned = await get_aligned_data()
    return analysis.daily_metrics(aligned)


@router.get("/metrics/hourly")
async def get_hourly_metrics():
    """Return the average error for each hour of the day (0-23)."""
    aligned = await get_aligned_data()
    return analysis.hourly_error_profile(aligned)


@router.get("/scatter")
async def get_scatter():
    """Return one {actual, forecast} pair per period, for a scatter plot."""
    aligned = await get_aligned_data()
    return [{"actual": row["actual"], "forecast": row["forecast"]} for row in aligned]


@router.get("/forecast-vintages")
async def get_forecast_vintages(target_date: date = Query(..., alias="date")):
    """Return how the forecast for one day changed as new forecasts came out.

    Example: /api/forecast-vintages?date=2026-01-11
    """
    actuals, forecasts = await get_raw_data()
    result = analysis.forecast_vintages(actuals, forecasts, target_date)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No data for that date. Use a date from 2026-01-01 to 2026-01-31.",
        )
    return result


@router.post("/cache/clear")
async def clear_cache():
    """Empty the cache so the next request fetches fresh data."""
    elexon.clear_cache()
    return {"status": "cache cleared"}
