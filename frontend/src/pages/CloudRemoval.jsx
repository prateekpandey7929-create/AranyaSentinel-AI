import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export default function CloudRemoval() {
  const [imageType, setImageType] = useState("after");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const handleRun = async () => {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const response = await axios.post(`${API_BASE}/cloud-removal?image_type=${imageType}`);
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Failed to execute cloud removal. Ensure you have run an initial Analysis first to download images."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <div className="space-y-3 z-10">
          <span className="bg-blue-950/40 text-blue-300 border border-blue-500/25 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase inline-block">
            Satellite Preprocessing Engine
          </span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            AI Cloud Removal & Monsoon Image Enhancement
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl font-medium">
            Automatically detect and mask clouds, fill gaps using historical scenes, and apply CLAHE contrast enhancement for clear AI monitoring.
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-lg">
        <div className="flex items-center space-x-4">
          <span className="text-slate-300 font-semibold text-sm">Select Target Image:</span>
          <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-forest-900/20">
            <button
              onClick={() => setImageType("after")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                imageType === "after"
                  ? "bg-forest-600 text-white shadow-md shadow-forest-900/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Current (After) Image
            </button>
            <button
              onClick={() => setImageType("before")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                imageType === "before"
                  ? "bg-forest-600 text-white shadow-md shadow-forest-900/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Historical (Before) Image
            </button>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={loading}
          className="bg-forest-500 hover:bg-forest-600 disabled:bg-slate-800 disabled:text-slate-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg transition duration-200 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Processing Imagery...</span>
            </>
          ) : (
            <span>Run Cloud Removal</span>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-5 rounded-2xl text-sm font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Results Section */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visual Outputs Panel */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold text-white tracking-wide border-b border-forest-900/20 pb-3">
              Process Visualization Comparison
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Original Image */}
              <div className="space-y-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block text-center">
                  Original Satellite Image
                </span>
                <div className="aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <img
                    src={`${API_BASE}${data.urls.original_image}?t=${Date.now()}`}
                    alt="Original satellite"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Card 2: Binary Cloud Mask */}
              <div className="space-y-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block text-center">
                  Detected Cloud Mask
                </span>
                <div className="aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 relative">
                  <img
                    src={`${API_BASE}${data.urls.cloud_mask}?t=${Date.now()}`}
                    alt="Cloud mask"
                    className="w-full h-full object-cover filter invert"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 text-[10px] text-red-400 px-2 py-1 rounded text-center font-bold">
                    White indicates clouds / gaps
                  </div>
                </div>
              </div>

              {/* Card 3: Reconstructed & Enhanced */}
              <div className="space-y-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block text-center">
                  AI Enhanced Output
                </span>
                <div className="aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <img
                    src={`${API_BASE}${data.urls.enhanced_image}?t=${Date.now()}`}
                    alt="Enhanced"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white tracking-wide border-b border-forest-900/20 pb-3">
                Pre-processing Metrics
              </h3>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center bg-forest-950/20 p-4 rounded-xl border border-forest-900/10">
                  <span className="text-slate-400 text-sm font-semibold">Image Quality Score</span>
                  <span className={`px-3 py-1 rounded text-xs font-extrabold tracking-wider uppercase ${
                    data.image_quality_score === "Excellent" ? "bg-emerald-900/40 text-emerald-300" :
                    data.image_quality_score === "Good" ? "bg-forest-900/40 text-forest-300" :
                    data.image_quality_score === "Moderate" ? "bg-amber-900/40 text-amber-300" :
                    "bg-red-900/40 text-red-300"
                  }`}>
                    {data.image_quality_score}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-forest-950/20 p-4 rounded-xl border border-forest-900/10">
                  <span className="text-slate-400 text-sm font-semibold">Original Cloud Cover</span>
                  <span className="text-white font-extrabold">{data.initial_cloud_percentage}%</span>
                </div>

                <div className="flex justify-between items-center bg-forest-950/20 p-4 rounded-xl border border-forest-900/10">
                  <span className="text-slate-400 text-sm font-semibold">Remaining Clouds</span>
                  <span className="text-emerald-400 font-extrabold">{data.final_cloud_percentage}%</span>
                </div>

                <div className="flex justify-between items-center bg-forest-950/20 p-4 rounded-xl border border-forest-900/10">
                  <span className="text-slate-400 text-sm font-semibold">Processing Speed</span>
                  <span className="text-white font-extrabold">{data.processing_time_seconds}s</span>
                </div>
              </div>
            </div>

            {data.warning ? (
              <div className="bg-amber-950/40 p-4 rounded-xl text-xs text-amber-300 border border-amber-500/20 leading-relaxed font-semibold">
                ⚠️ {data.warning}
              </div>
            ) : (
              <div className="bg-forest-950/40 p-4 rounded-xl text-xs text-slate-400 border border-forest-900/20 leading-relaxed">
                <strong>Status Clear:</strong> The reconstruction successfully filled cloud cover gaps. This scene is now optimized for NDVI mapping and AI model evaluation.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
