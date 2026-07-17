import React, { useState, useEffect } from "react";
import axios from "axios";

// Subcomponents (To be created next)
import HistoryFilters from "../components/History/HistoryFilters";
import TrendCards from "../components/History/TrendCards";
import HistoryCharts from "../components/History/HistoryCharts";
import HistoryTimeline from "../components/History/HistoryTimeline";
import Comparison from "../components/History/Comparison";
import TrendSummary from "../components/History/TrendSummary";

import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

export default function History() {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const [trendsData, setTrendsData] = useState(null);
  const [error, setError] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    forestName: "All",
    severity: "All"
  });

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const [histRes, trendRes] = await Promise.all([
        axios.get(`${API_BASE}/history/`),
        axios.get(`${API_BASE}/history/trends`)
      ]);
      setHistoryData(histRes.data);
      setTrendsData(trendRes.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setError("Failed to load historical data. Ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter history data
  const filteredHistory = historyData.filter(item => {
    if (filters.forestName !== "All" && item.forest_name !== filters.forestName) return false;
    if (filters.severity !== "All" && item.severity !== filters.severity) return false;
    return true;
  });

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-red-400">
        <div className="glass-panel p-6 rounded-2xl">
          <p>{error}</p>
          <button onClick={fetchHistory} className="mt-4 px-4 py-2 bg-slate-800 rounded">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-forest-900/30 pb-4 gap-4">
        <div>
          <Link to="/analyze" className="inline-flex items-center space-x-2 text-forest-400 hover:text-emerald-400 mb-4 transition-colors">
            <ArrowLeft size={16} />
            <span className="text-sm font-semibold uppercase tracking-wider">Back to Analysis</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-3">
            <span className="text-4xl"></span> Historical Trend Analysis
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-mono">
            Compare forest loss, NDVI shifts, and severity over time.
          </p>
        </div>
      </div>

      {/* Filters */}
      <HistoryFilters filters={filters} setFilters={setFilters} />

      {/* Trend Summary */}
      <TrendSummary data={filteredHistory} trends={trendsData} loading={loading} />

      {/* KPI Trend Cards */}
      <TrendCards data={filteredHistory} loading={loading} />

      {/* Charts Grid */}
      <HistoryCharts trends={trendsData} loading={loading} />

      {/* Comparison Module */}
      <Comparison historyData={filteredHistory} loading={loading} />

      {/* Timeline List */}
      <HistoryTimeline historyData={filteredHistory} loading={loading} />

    </div>
  );
}
