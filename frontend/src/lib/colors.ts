// Colours used by the charts. They point at the CSS variables defined in
// index.css, so the charts and the Tailwind classes always share one palette.

export const colors = {
  // Data colours
  forecast: "var(--color-forecast)",
  actual: "var(--color-actual)",
  error: "var(--color-error)",
  danger: "var(--color-danger)",
  info: "var(--color-info)",

  // Chart furniture
  grid: "var(--color-border)",
  axis: "var(--color-border-active)",
  textSecondary: "var(--color-fg-secondary)",
  textMuted: "var(--color-fg-muted)",
  hoverFill: "var(--color-elevated)",
};
