import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

// Import Upgraded Reusable Dashboard Components
import Header from "../components/Dashboard/Header";
import SummaryCards from "../components/Dashboard/SummaryCards";
import ImageCompare from "../components/Dashboard/ImageCompare";
import MapSection from "../components/Dashboard/MapSection";
import Analytics from "../components/Dashboard/Analytics";
import ForestHealth from "../components/Dashboard/ForestHealth";
import AiSummary from "../components/Dashboard/AiSummary";
import Prediction from "../components/Dashboard/Prediction";
import Knowledge from "../components/Dashboard/Knowledge";
import ReportsSection from "../components/Dashboard/ReportsSection";
import HistorySection from "../components/Dashboard/HistorySection";
import { ErrorPanel, LoadingSpinner } from "../components/Dashboard/Common";

const API_BASE = "http://127.0.0.1:8000";

export default function Dashboard() {
  const { t } = useTranslation();
  const [config, setConfig] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [summaryText, setSummaryText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState("");

  const [forestHealth, setForestHealth] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [knowledge, setKnowledge] = useState(null);
  const [history, setHistory] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch current settings config
      const configRes = await axios.get(`${API_BASE}/config`);
      setConfig(configRes.data);

      // 2. Fetch latest analysis metrics (from severity.json)
      try {
        const severityRes = await axios.get(`${API_BASE}/severity`);
        setMetrics(severityRes.data);
        
        // Calculate dynamic last run time if execution_times is present
        if (severityRes.data?.execution_times) {
          const runDate = new Date().toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric"
          });
          setLastAnalysisTime(`${runDate} (${severityRes.data.execution_times.total_execution_seconds}s run)`);
        } else {
          setLastAnalysisTime("Baseline Run Active");
        }
      } catch (err) {
        console.warn("No active severity metrics found on disk. Run analysis first.");
        setMetrics(null);
      }

      // 3. Fetch summary text preview if available
      try {
        const summaryRes = await axios.get(`${API_BASE}/summary`);
        setSummaryText(summaryRes.data);
      } catch (err) {
        console.warn("No summary report text found on disk.");
        setSummaryText("");
      }

      // 4. Fetch dynamic upgraded endpoints
      try {
        const [healthRes, aiRes, predRes, knowRes, histRes] = await Promise.all([
          axios.get(`${API_BASE}/forest-health`),
          axios.get(`${API_BASE}/ai-summary`),
          axios.get(`${API_BASE}/predictions`),
          axios.get(`${API_BASE}/knowledge-base`),
          axios.get(`${API_BASE}/activity-log`)
        ]);
        setForestHealth(healthRes.data);
        setAiSummary(aiRes.data);
        setPrediction(predRes.data);
        setKnowledge(knowRes.data);
        setHistory(histRes.data);
      } catch (err) {
        console.warn("Could not retrieve some upgraded endpoints, falling back.", err);
      }
    } catch (err) {
      console.error("Dashboard failed to retrieve backend datasets:", err);
      setError("Unable to connect to FastAPI backend server. Verify the server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const downloadTextReport = () => {
    if (!summaryText) return;
    const blob = new Blob([summaryText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "summary_report.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadJsonReport = () => {
    if (!metrics) return;
    const blob = new Blob([JSON.stringify(metrics, null, 4)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "severity_metrics.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ErrorPanel message={error} retryTrigger={fetchData} />
      </div>
    );
  }

  // Calculate dynamic center and bounding coordinates for results display map
  let mapCenter = [22.45, 78.20];
  let mapBounds = [[22.43, 78.18], [22.47, 78.22]];
  if (config?.roi) {
    mapCenter = [config.roi.lat, config.roi.lon];
    const buf = config.roi.buffer_degree || 0.02;
    mapBounds = [
      [config.roi.lat - buf, config.roi.lon - buf],
      [config.roi.lat + buf, config.roi.lon + buf]
    ];
  }

  // Pre-mapped output urls from backend mount static directories
  const beforeUrl = metrics ? `${API_BASE}/static/before_rgb.png` : null;
  const afterUrl = metrics ? `${API_BASE}/static/after_rgb.png` : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* SECTION 1: Top Header */}
      <Header config={config} lastAnalysisTime={lastAnalysisTime} />

      {/* SECTION 2: Summary Cards */}
      <SummaryCards metrics={metrics} loading={loading} healthScore={forestHealth?.score} />

      {/* Grid Layout for map, slider, and charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* SECTION 3: Before / After Slider Comparison */}
        <ImageCompare beforeUrl={beforeUrl} afterUrl={afterUrl} loading={loading} />

        {/* SECTION 4: Interactive GIS Map */}
        <MapSection center={mapCenter} bounds={mapBounds} analysisResult={metrics ? { output_files: { heatmap: "/static/heatmap.png", change_mask: "/static/change_mask.png" } } : null} loading={loading} />
      </div>

      {/* SECTION 5: Analytics Charts */}
      <Analytics metrics={metrics} loading={loading} />

      {/* Grid Layout for Health score & AI summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SECTION 6: Forest Health breakdown */}
        <div className="lg:col-span-2">
          <ForestHealth metrics={metrics} loading={loading} healthScore={forestHealth?.score} healthMetrics={forestHealth?.metrics} />
        </div>

        {/* SECTION 7: AI Copilot text summary */}
        <div className="lg:col-span-1">
          <AiSummary metrics={metrics} loading={loading} insights={aiSummary} />
        </div>
      </div>

      {/* SECTION 8: Predictive Analytics */}
      <Prediction metrics={metrics} loading={loading} predictionData={prediction} />

      {/* SECTION 9: Ecosystem Knowledge Explorer */}
      <Knowledge knowledgeData={knowledge} />

      {/* Grid Layout for reports & history timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECTION 10: Reports downloaders */}
        <ReportsSection
          metrics={metrics}
          summaryText={summaryText}
          downloadTextReport={downloadTextReport}
          downloadJsonReport={downloadJsonReport}
          loading={loading}
        />

        {/* SECTION 11: Activity timeline log */}
        <HistorySection events={history} />
      </div>
    </div>
  );
}
