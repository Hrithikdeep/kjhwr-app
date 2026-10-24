// Helpers for displaying numbers and dates consistently.

// Whole numbers with thousands separators, e.g. 8432 -> "8,432"
const numberFormat = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0,
});

// UK style date and time, e.g. "01 Jan 2026, 00:30".
// The timezone is set to London so the result is always UK local time.
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});

// Short date and time, e.g. "12 Jan, 01:00" (UK local time)
const shortDateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});

// Short date for chart axes, e.g. "1 Jan". The backend's days are UTC days,
// so we read them as UTC to keep each reading on the correct day.
const shortDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

// Date with the day of the week, e.g. "Sun 11 Jan" (used in the date picker)
const weekdayDateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

// 3000 -> "3,000"
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

// 1234 -> "+1,234", -1234 -> "-1,234", 0 -> "0". The plus sign makes
// positive errors (forecast too high) easy to tell from negative ones.
export function formatSignedNumber(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${numberFormat.format(value)}`;
}

// 1855 -> "+1,855 MW", -3312 -> "-3,312 MW"
export function formatSignedMW(value: number): string {
  return `${formatSignedNumber(value)} MW`;
}

// 8432 -> "8,432 MW"
export function formatMW(value: number): string {
  return `${numberFormat.format(value)} MW`;
}

// 20.784 -> "20.8%". Returns a dash when there is no value.
export function formatPct(value: number | null, decimals = 1): string {
  if (value === null) {
    return "–";
  }
  return `${value.toFixed(decimals)}%`;
}

// "2026-01-01T00:30:00Z" -> "01 Jan 2026, 00:30"
export function formatDateTime(isoString: string): string {
  return dateTimeFormat.format(new Date(isoString));
}

// "2026-01-12T01:00:00Z" -> "12 Jan, 01:00"
export function formatShortDateTime(isoString: string): string {
  return shortDateTimeFormat.format(new Date(isoString));
}

// "2026-01-01" or "2026-01-01T00:30:00Z" -> "1 Jan"
export function formatShortDate(dateString: string): string {
  return shortDateFormat.format(new Date(dateString));
}

// "2026-01-11" -> "Sun 11 Jan"
export function formatWeekdayDate(dateString: string): string {
  return weekdayDateFormat.format(new Date(dateString));
}
