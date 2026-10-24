// Helper for building chart axis ticks.

// Returns evenly spaced ticks that cover every value from min to max.
// Example: makeTicks(0, 13435, 3000) -> [0, 3000, 6000, 9000, 12000, 15000]
export function makeTicks(min: number, max: number, step: number): number[] {
  const first = Math.floor(min / step) * step;
  let last = Math.ceil(max / step) * step;

  // Make sure there are always at least two ticks
  if (last === first) {
    last = first + step;
  }

  const ticks: number[] = [];
  for (let value = first; value <= last; value += step) {
    ticks.push(value);
  }
  return ticks;
}
