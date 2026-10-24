import { Calendar, Settings, Wind } from "lucide-react";
import type { Tab } from "../types";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "forecast", label: "Forecast Analysis" },
  { id: "errors", label: "Error Metrics" },
];

// The top bar: logo on the left, tabs in the middle, date and settings on the right.
// On narrow screens (below "md") the tabs move to their own row under the logo.
function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg">
      <div className="grid grid-cols-[1fr_auto] items-center px-4 md:h-14 md:grid-cols-[1fr_auto_1fr] md:px-6">
        {/* Left: logo and name */}
        <div className="flex h-14 items-center gap-2.5 md:h-auto">
          <Wind size={20} className="text-forecast" />
          <span className="font-bold text-fg">WindSight</span>
          <span className="hidden text-xs text-fg-secondary xl:inline">
            Wind Generation Intelligence
          </span>
        </div>

        {/* Tabs. The active one is blue with a blue underline. */}
        <nav className="order-last col-span-2 flex h-11 gap-6 overflow-x-auto md:order-0 md:col-span-1 md:h-full lg:gap-8">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            const colourClass = isActive
              ? "border-forecast text-forecast"
              : "border-transparent text-fg-secondary hover:text-fg";

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`h-full shrink-0 whitespace-nowrap border-b-2 text-sm font-medium transition-colors ${colourClass}`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: the month shown and a settings icon (neither does anything yet) */}
        <div className="flex h-14 items-center justify-end gap-3 md:h-auto">
          <div className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-sm text-fg">
            <Calendar size={16} className="text-fg-secondary" />
            January 2026
          </div>
          <button
            type="button"
            aria-label="Settings"
            className="rounded-lg p-1.5 text-fg-secondary transition-colors hover:bg-elevated hover:text-fg"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
