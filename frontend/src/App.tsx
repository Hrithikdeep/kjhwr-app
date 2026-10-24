import { useState } from "react";
import ErrorMetricsTab from "./components/ErrorMetricsTab";
import ForecastAnalysisTab from "./components/ForecastAnalysisTab";
import Header from "./components/Header";
import OverviewTab from "./components/OverviewTab";
import { useWindData } from "./hooks/useWindData";
import type { Tab } from "./types";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // The data is loaded once here and shared with the tabs,
  // so switching tabs does not load it again.
  const windData = useWindData();

  return (
    <div className="min-h-screen bg-bg text-fg">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {activeTab === "overview" && <OverviewTab {...windData} />}
        {activeTab === "forecast" && <ForecastAnalysisTab {...windData} />}
        {activeTab === "errors" && <ErrorMetricsTab {...windData} />}
      </main>
    </div>
  );
}

export default App;
