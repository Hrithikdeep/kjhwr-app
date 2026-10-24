"""Functions for fetching wind data from the Elexon BMRS API."""

import logging
from datetime import datetime, timezone

import httpx
from dateutil import parser

logger = logging.getLogger(__name__)

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"

# Elexon can be slow, so we allow up to 60 seconds per request
REQUEST_TIMEOUT = httpx.Timeout(60.0)

# We only care about periods that START in January 2026 (UTC)
JANUARY_START = datetime(2026, 1, 1, tzinfo=timezone.utc)
FEBRUARY_START = datetime(2026, 2, 1, tzinfo=timezone.utc)

# Forecasts are published ahead of time, so we look back to late December
# to catch forecasts that were made before 1 January for January periods
FORECAST_PUBLISHED_FROM = "2025-12-25T00:00:00Z"
FORECAST_PUBLISHED_TO = "2026-01-31T23:59:59Z"

# In-memory cache: maps a name ("actuals" or "forecasts") to its records
_cache: dict[str, list[dict]] = {}


def clear_cache() -> None:
    """Remove everything from the cache so the next call fetches fresh data."""
    _cache.clear()
    logger.info("Cache cleared")


def _is_in_january(start_time: str) -> bool:
    """Return True if the given ISO timestamp falls inside January 2026."""
    start = parser.isoparse(start_time)
    return JANUARY_START <= start < FEBRUARY_START


async def _fetch_stream(dataset: str, params: dict) -> list[dict]:
    """Call /datasets/{dataset}/stream and return the raw list of records."""
    url = f"{BASE_URL}/datasets/{dataset}/stream"
    logger.info("Requesting %s from Elexon", dataset)

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
    except httpx.HTTPError as error:
        logger.error("Elexon request for %s failed: %s", dataset, error)
        raise

    records = response.json()
    logger.info("Elexon returned %d raw %s records", len(records), dataset)
    return records


async def fetch_actuals(force_refresh: bool = False) -> list[dict]:
    """Fetch actual wind generation (FUELHH) for January 2026.

    Each record looks like: {"startTime": "...", "generation": 15538}
    """
    if "actuals" in _cache and not force_refresh:
        logger.info("Returning cached actuals (%d records)", len(_cache["actuals"]))
        return _cache["actuals"]

    raw_records = await _fetch_stream(
        "FUELHH",
        params={
            "settlementDateFrom": "2026-01-01",
            "settlementDateTo": "2026-01-31",
            "fuelType": "WIND",
        },
    )

    actuals = []
    for record in raw_records:
        # FUELHH contains many fuel types, so we double-check we only keep wind
        if record["fuelType"] != "WIND":
            continue
        if not _is_in_january(record["startTime"]):
            continue
        actuals.append(
            {
                "startTime": record["startTime"],
                "generation": record["generation"],
            }
        )

    actuals.sort(key=lambda r: r["startTime"])
    logger.info("Kept %d actual wind records for January 2026", len(actuals))

    _cache["actuals"] = actuals
    return actuals


async def fetch_forecasts(force_refresh: bool = False) -> list[dict]:
    """Fetch wind generation forecasts (WINDFOR) for January 2026.

    Each record looks like:
    {"startTime": "...", "publishTime": "...", "generation": 6086}
    """
    if "forecasts" in _cache and not force_refresh:
        logger.info("Returning cached forecasts (%d records)", len(_cache["forecasts"]))
        return _cache["forecasts"]

    raw_records = await _fetch_stream(
        "WINDFOR",
        params={
            "publishDateTimeFrom": FORECAST_PUBLISHED_FROM,
            "publishDateTimeTo": FORECAST_PUBLISHED_TO,
        },
    )

    forecasts = []
    for record in raw_records:
        if not _is_in_january(record["startTime"]):
            continue
        forecasts.append(
            {
                "startTime": record["startTime"],
                "publishTime": record["publishTime"],
                "generation": record["generation"],
            }
        )

    # Sort by the period being predicted, then by when the forecast was made
    forecasts.sort(key=lambda r: (r["startTime"], r["publishTime"]))
    logger.info("Kept %d forecast records for January 2026", len(forecasts))

    _cache["forecasts"] = forecasts
    return forecasts
