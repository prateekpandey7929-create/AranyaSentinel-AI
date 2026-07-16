import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export default function Reports() {
  const [summaryText, setSummaryText] = useState("");
  const [severityJson, setSeverityJson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [sumRes, sevRes] = await Promise.all([
          axios.get(`${API_BASE}/summary`),
          axios.get(`${API_BASE}/severity`)
        ]);
        setSummaryText(sumRes.data);
        setSeverityJson(sevRes.data);
      } catch (err) {
        setError("Reports not found. Please execute /analyze pipeline first.");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const downloadTextReport = () => {
    const blob = new Blob([summaryText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "summary_report.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadJsonReport = () => {
    const blob = new Blob([JSON.stringify(severityJson, null, 4)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "severity_metrics.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Analysis Reports</h1>
        <p className="text-slate-400 text-sm mt-1">
          Review or download the compiled analytical data output documents.
        </p>
      </div>

      {error && (
        <div className="glass-panel p-8 rounded-3xl text-center text-slate-400 space-y-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-lg font-bold">{error}</p>
          <p className="text-xs text-slate-500">Go to the Analysis page to start a new analysis run.</p>
        </div>
      )}

      {!error && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Summary Report panel */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center border-b border-forest-900/20 pb-3">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">summary.txt</h3>
              <button
                onClick={downloadTextReport}
                className="bg-forest-600 hover:bg-forest-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition"
              >
                Download TXT
              </button>
            </div>
            
            <pre className="bg-slate-950/80 p-4 rounded-xl text-slate-300 text-xs font-mono overflow-auto h-[350px] border border-forest-900/10 leading-relaxed">
              {summaryText}
            </pre>
          </div>

          {/* Severity JSON panel */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center border-b border-forest-900/20 pb-3">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">severity.json</h3>
              <button
                onClick={downloadJsonReport}
                className="bg-forest-600 hover:bg-forest-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition"
              >
                Download JSON
              </button>
            </div>

            <pre className="bg-slate-950/80 p-4 rounded-xl text-emerald-400 text-xs font-mono overflow-auto h-[350px] border border-forest-900/10 leading-relaxed">
              {JSON.stringify(severityJson, null, 4)}
            </pre>
          </div>
        </div>
      )}

      {loading && (
        <div className="glass-panel p-8 rounded-3xl text-center text-slate-400 animate-pulse">
          Loading report datasets...
        </div>
      )}
    </div>
  );
}
