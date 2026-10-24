import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { formatDateTime, formatNumber, formatPct, formatSignedNumber } from "../lib/format";
import type { AlignedPoint } from "../types";
import ChartCard from "./ChartCard";

interface PeriodTableProps {
  points: AlignedPoint[];
}

type SortKey = "startTime" | "actual" | "forecast" | "error" | "pctError";
type SortDirection = "asc" | "desc";

const ROWS_PER_PAGE = 20;

// Errors bigger than this (in MW) are coloured: red when the forecast was
// too high, blue when it was too low. Smaller errors stay grey.
const LARGE_ERROR_MW = 1000;

const COLUMNS: { key: SortKey; label: string; alignRight: boolean }[] = [
  { key: "startTime", label: "Date / Time", alignRight: false },
  { key: "actual", label: "Actual (MW)", alignRight: true },
  { key: "forecast", label: "Forecast (MW)", alignRight: true },
  { key: "error", label: "Error (MW)", alignRight: true },
  { key: "pctError", label: "% Error", alignRight: true },
];

// The number a row is sorted by. Rows with no value (null) are sorted last.
function getSortValue(point: AlignedPoint, key: SortKey): number | null {
  if (key === "startTime") {
    return Date.parse(point.startTime);
  }
  return point[key];
}

// "11 Jan 2026, 14:30" -> ["11", "jan", "2026", "14:30"]
function splitIntoWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((word) => word !== "");
}

// Does a typed word match the start of one of the row's date or time words?
// A word with a colon (like "14:30") can only match a time, and a word
// without one (like "11") can only match a day, month or year. So "11" finds
// the 11th, not every period at 11:00 or 11:30.
function wordMatches(searchWord: string, dateWords: string[]): boolean {
  const searchIsTime = searchWord.includes(":");
  return dateWords.some(
    (dateWord) => dateWord.includes(":") === searchIsTime && dateWord.startsWith(searchWord)
  );
}

function errorColourClass(error: number): string {
  if (error > LARGE_ERROR_MW) {
    return "text-danger";
  }
  if (error < -LARGE_ERROR_MW) {
    return "text-forecast";
  }
  return "text-fg-secondary";
}

function PeriodTable({ points }: PeriodTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("startTime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(0); // the first page is 0

  // The words of each row's date and time as shown in the table, e.g.
  // "11 Jan 2026, 14:30" -> ["11", "jan", "2026", "14:30"].
  // Built once, not on every key press.
  const rows = useMemo(
    () =>
      points.map((point) => ({
        point,
        dateWords: splitIntoWords(formatDateTime(point.startTime)),
      })),
    [points]
  );

  // Apply the search, then the sort
  const visiblePoints = useMemo(() => {
    const searchWords = splitIntoWords(search);
    const matching = rows
      .filter((row) => searchWords.every((word) => wordMatches(word, row.dateWords)))
      .map((row) => row.point);

    return matching.sort((a, b) => {
      const first = getSortValue(a, sortKey);
      const second = getSortValue(b, sortKey);

      // Missing values always go to the bottom, whichever way we sort
      if (first === null && second === null) return 0;
      if (first === null) return 1;
      if (second === null) return -1;

      const result = first - second;
      return sortDirection === "asc" ? result : -result;
    });
  }, [rows, search, sortKey, sortDirection]);

  // Work out which 20 rows to show on this page
  const pageCount = Math.max(1, Math.ceil(visiblePoints.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const firstIndex = currentPage * ROWS_PER_PAGE;
  const pagePoints = visiblePoints.slice(firstIndex, firstIndex + ROWS_PER_PAGE);

  // Clicking a header sorts by that column. Clicking it again reverses the order.
  // A new column starts with the biggest values first (except dates, oldest first).
  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection(key === "startTime" ? "asc" : "desc");
    }
    setPage(0);
  }

  function handleSearch(text: string) {
    setSearch(text);
    setPage(0);
  }

  const searchBox = (
    <label className="relative block">
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
      />
      <input
        type="text"
        value={search}
        onChange={(event) => handleSearch(event.target.value)}
        placeholder="Search date or time, e.g. 11 jan 14:30"
        aria-label="Search the table"
        className="w-64 rounded-lg border border-border bg-elevated py-1.5 pl-8 pr-3 text-sm text-fg placeholder:text-fg-muted transition-colors hover:border-border-active focus:border-forecast focus:outline-none"
      />
    </label>
  );

  const showingFrom = visiblePoints.length === 0 ? 0 : firstIndex + 1;
  const showingTo = firstIndex + pagePoints.length;

  return (
    <ChartCard
      title="Period Detail"
      subtitle="Forecast vs actual for every 30-minute period · click a column to sort"
      actions={searchBox}
      skeletonHeight={500}
    >
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-elevated/60">
              {COLUMNS.map((column) => {
                const isSorted = column.key === sortKey;
                const ariaSort = isSorted
                  ? sortDirection === "asc"
                    ? "ascending"
                    : "descending"
                  : "none";

                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-fg-secondary ${
                      column.alignRight ? "text-right" : "text-left"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap uppercase transition-colors hover:text-fg ${
                        isSorted ? "text-fg" : ""
                      }`}
                    >
                      {column.label}
                      {isSorted && sortDirection === "asc" && <ArrowUp size={12} />}
                      {isSorted && sortDirection === "desc" && <ArrowDown size={12} />}
                      {!isSorted && <ChevronsUpDown size={12} className="text-fg-muted" />}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {pagePoints.map((point) => (
              <tr key={point.startTime} className="even:bg-elevated/30">
                <td className="whitespace-nowrap px-4 py-2 text-fg">{formatDateTime(point.startTime)}</td>
                <td className="px-4 py-2 text-right font-mono text-fg">
                  {formatNumber(point.actual)}
                </td>
                <td className="px-4 py-2 text-right font-mono text-fg">
                  {formatNumber(point.forecast)}
                </td>
                <td
                  className={`px-4 py-2 text-right font-mono font-medium ${errorColourClass(point.error)}`}
                >
                  {formatSignedNumber(point.error)}
                </td>
                <td className="px-4 py-2 text-right font-mono text-fg-secondary">
                  {formatPct(point.pctError)}
                </td>
              </tr>
            ))}

            {pagePoints.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-fg-secondary">
                  No periods match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: which rows are shown, and the page buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-fg-secondary">
        <p>
          Showing {formatNumber(showingFrom)}–{formatNumber(showingTo)} of{" "}
          {formatNumber(visiblePoints.length)} periods
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="Previous page"
            className="rounded-lg border border-border bg-elevated p-1.5 transition-colors hover:border-border-active disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>
          <span>
            Page {formatNumber(currentPage + 1)} of {formatNumber(pageCount)}
          </span>
          <button
            type="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= pageCount - 1}
            aria-label="Next page"
            className="rounded-lg border border-border bg-elevated p-1.5 transition-colors hover:border-border-active disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </ChartCard>
  );
}

export default PeriodTable;
