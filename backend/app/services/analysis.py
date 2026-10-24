"""Aligns forecasts with actuals and computes forecast error metrics."""

import math
from bisect import bisect_right
from datetime import date, datetime, timedelta, timezone

from dateutil import parser

# Day-ahead use case: only forecasts published at least 24 hours before delivery
MIN_FORECAST_LEAD_TIME = timedelta(hours=24)

# An hourly forecast may be reused for the half-hour after it, but no longer
MAX_FORECAST_AGE = timedelta(hours=1)


def get_latest_forecasts(forecasts: list[dict]) -> dict[str, dict]:
    """For each startTime, keep the forecast with the latest publishTime
    that was published at least MIN_FORECAST_LEAD_TIME before that period.

    This models a day-ahead decision: we only use forecasts that existed
    a day before delivery. Newer forecasts are ignored, because they would
    not have been available when the decision was made (look-ahead bias).
    Periods with no forecast old enough are not in the result.

    Returns a dictionary: {startTime: forecast record}.
    """
    latest = {}
    for forecast in forecasts:
        start_time = forecast["startTime"]

        # How far ahead of the delivery period was this forecast published?
        lead_time = parser.isoparse(start_time) - parser.isoparse(forecast["publishTime"])
        if lead_time < MIN_FORECAST_LEAD_TIME:
            continue

        # Keep this forecast if it is the first we have seen for this period,
        # or if it was published later than the one we already have.
        # (The timestamps are all UTC in the same format, so comparing them
        # as text gives the same answer as comparing them as dates.)
        if start_time not in latest or forecast["publishTime"] > latest[start_time]["publishTime"]:
            latest[start_time] = forecast
    return latest


def align_data(actuals: list[dict], forecasts: list[dict]) -> list[dict]:
    """Match each actual with the most recent forecast that starts at or before it.

    Forecasts are hourly but actuals are half-hourly, so the forecast for
    00:00 is used for both the 00:00 and the 00:30 actuals (forward-fill).
    Actuals with no suitable forecast are left out, because there is
    nothing to compare them with.
    """
    latest_forecasts = get_latest_forecasts(forecasts)

    # All forecast start times in order (the text timestamps sort correctly)
    forecast_times = sorted(latest_forecasts)

    aligned = []
    for actual_record in actuals:
        start_time = actual_record["startTime"]

        # How many forecast start times are at or before this actual?
        # The last of those is the most recent forecast period.
        count_before = bisect_right(forecast_times, start_time)
        if count_before == 0:
            continue
        forecast_time = forecast_times[count_before - 1]

        # Don't fill from a forecast that is too old (e.g. if an hour is missing)
        age = parser.isoparse(start_time) - parser.isoparse(forecast_time)
        if age >= MAX_FORECAST_AGE:
            continue

        actual = actual_record["generation"]
        forecast = latest_forecasts[forecast_time]["generation"]

        error = forecast - actual  # positive = forecast was too high
        abs_error = abs(error)

        # Percentage error is undefined when the actual is zero
        if actual == 0:
            pct_error = None
        else:
            pct_error = abs_error / actual * 100

        aligned.append(
            {
                "startTime": start_time,
                "actual": actual,
                "forecast": forecast,
                "error": error,
                "absError": abs_error,
                "pctError": pct_error,
            }
        )

    aligned.sort(key=lambda row: row["startTime"])
    return aligned


def compute_metrics(aligned: list[dict]) -> dict:
    """Calculate summary error metrics for a list of aligned rows."""
    count = len(aligned)
    if count == 0:
        return {
            "count": 0,
            "mae": None,
            "rmse": None,
            "mape": None,
            "meanBias": None,
            "avgActual": None,
            "avgForecast": None,
            "maxError": None,
            "minError": None,
        }

    errors = [row["error"] for row in aligned]
    abs_errors = [row["absError"] for row in aligned]
    squared_errors = [error ** 2 for error in errors]

    # MAPE only uses periods where the percentage error could be calculated
    pct_errors = [row["pctError"] for row in aligned if row["pctError"] is not None]
    if pct_errors:
        mape = sum(pct_errors) / len(pct_errors)
    else:
        mape = None

    return {
        "count": count,
        "mae": round(sum(abs_errors) / count, 2),
        "rmse": round(math.sqrt(sum(squared_errors) / count), 2),
        "mape": round(mape, 2) if mape is not None else None,
        "meanBias": round(sum(errors) / count, 2),
        "avgActual": round(sum(row["actual"] for row in aligned) / count, 2),
        "avgForecast": round(sum(row["forecast"] for row in aligned) / count, 2),
        "maxError": max(errors),  # biggest over-forecast
        "minError": min(errors),  # biggest under-forecast (most negative)
    }


def daily_metrics(aligned: list[dict]) -> list[dict]:
    """Calculate the metrics separately for each calendar day (UTC)."""
    rows_by_day = {}
    for row in aligned:
        day = parser.isoparse(row["startTime"]).date().isoformat()
        rows_by_day.setdefault(day, []).append(row)

    results = []
    for day in sorted(rows_by_day):
        metrics = compute_metrics(rows_by_day[day])
        metrics["date"] = day
        results.append(metrics)
    return results


def daily_comparison(aligned: list[dict]) -> list[dict]:
    """Average actual, forecast and error for each calendar day (UTC)."""
    rows_by_day = {}
    for row in aligned:
        day = parser.isoparse(row["startTime"]).date().isoformat()
        rows_by_day.setdefault(day, []).append(row)

    results = []
    for day in sorted(rows_by_day):
        rows = rows_by_day[day]
        results.append(
            {
                "startTime": day,
                "actual": round(sum(r["actual"] for r in rows) / len(rows), 2),
                "forecast": round(sum(r["forecast"] for r in rows) / len(rows), 2),
                "error": round(sum(r["error"] for r in rows) / len(rows), 2),
            }
        )
    return results


def forecast_vintages(actuals: list[dict], forecasts: list[dict], day: date) -> dict | None:
    """Show how the forecast for one day changed as new forecasts were published.

    Every time a forecast is published it gives a value for each hour it
    covers. For each publishTime we average the values it gave for the
    hours of this day. Comparing those averages from the oldest forecast to
    the newest, next to the actual average, shows whether the forecast
    moved towards what really happened.

    Returns None if there are no actuals for that day.
    """
    # Timestamps look like "2026-01-11T00:30:00Z", so the first 10
    # characters are the (UTC) date
    day_text = day.isoformat()

    day_actuals = [row["generation"] for row in actuals if row["startTime"][:10] == day_text]
    if not day_actuals:
        return None

    # Collect, for each publishTime, the forecast values it gave for this day.
    # (Forecasts are hourly, so each value stands for two half-hour periods.
    # The average over the hours equals the average over the half-hours.)
    values_by_publish_time = {}
    for forecast in forecasts:
        if forecast["startTime"][:10] == day_text:
            values_by_publish_time.setdefault(forecast["publishTime"], []).append(
                forecast["generation"]
            )

    day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)

    vintages = []
    for publish_time in sorted(values_by_publish_time):
        values = values_by_publish_time[publish_time]

        # Hours between publishing and midnight at the start of the day.
        # Negative means it was published after the day had already begun.
        hours_ahead = (day_start - parser.isoparse(publish_time)).total_seconds() / 3600

        vintages.append(
            {
                "publishTime": publish_time,
                "hoursAhead": round(hours_ahead, 1),
                "forecastAvg": round(sum(values) / len(values), 2),
                # How many of the day's 24 hours this forecast covered.
                # Fewer than 24 means the average is for part of the day only.
                "periodsCovered": len(values),
            }
        )

    return {
        "date": day_text,
        "actualAvg": round(sum(day_actuals) / len(day_actuals), 2),
        "vintages": vintages,
    }


def hourly_error_profile(aligned: list[dict]) -> list[dict]:
    """Average the errors by hour of day (0-23, UTC) across the whole month."""
    rows_by_hour = {}
    for row in aligned:
        hour = parser.isoparse(row["startTime"]).hour
        rows_by_hour.setdefault(hour, []).append(row)

    results = []
    for hour in sorted(rows_by_hour):
        rows = rows_by_hour[hour]
        results.append(
            {
                "hour": hour,
                "label": f"{hour:02d}:00",
                "meanError": round(sum(r["error"] for r in rows) / len(rows), 2),
                "meanAbsError": round(sum(r["absError"] for r in rows) / len(rows), 2),
                "count": len(rows),
            }
        )
    return results
