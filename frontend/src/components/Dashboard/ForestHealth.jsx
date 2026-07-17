import React from "react";

export default function ForestHealth({ metrics, loading, healthScore, healthMetrics }) {
  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl animate-pulse flex flex-col justify-center items-center h-[350px]">
        <div className="h-8 bg-forest-900/40 rounded w-1/4 mb-4"></div>
        <div className="h-32 w-32 bg-forest-900/40 rounded-full mb-4"></div>
        <div className="h-4 bg-forest-900/40 rounded w-1/2"></div>
      </div>
    );
  }

  const lossPct = metrics?.forest_loss_percentage ?? 0.0;
  const encroachments = metrics?.encroachment_count ?? 0;
  
  // Calculate mock score
  const score = healthScore ?? Math.max(15, Math.round(100 - (lossPct * 2.5) - (encroachments * 3)));
  const status = score > 80 ? "Healthy" : score > 50 ? "Moderate" : "Critical";
  const strokeColor = score > 80 ? "#10b981" : score > 50 ? "#f59e0b" : "#ef4444";
  const healthBgColor = score > 80 ? "rgba(16, 185, 129, 0.1)" : score > 50 ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)";

  // SVG parameters
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Detailed breakdown mock data
  const indicators = healthMetrics ?? [
    { name: "Vegetation Index (NDVI)", val: `${Math.max(10, 95 - Math.round(lossPct * 3))}%`, level: "Good" },
    { name: "Canopy Density", val: `${Math.max(10, 88 - Math.round(lossPct * 4))}%`, level: "Good" },
    { name: "Water Index (NDWI)", val: "68%", level: "Stable" },
    { name: "Human Encroachment Level", val: encroachments > 3 ? "High Activity" : encroachments > 0 ? "Minor Shift" : "Undisturbed", level: encroachments > 0 ? "Warning" : "Clear" },
    { name: "Seasonal Fire Risk", val: "18%", level: "Low" }
  ];

  return (
    <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-around gap-6">
      {/* Circle progress gauge */}
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Canopy Health Index</h3>
        <div className="relative w-36 h-36 flex items-center justify-center rounded-full" style={{ background: healthBgColor }}>
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-slate-800/40 fill-none"
              strokeWidth="10"
            />
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="fill-none transition-all duration-500 ease-out"
              strokeWidth="10"
              stroke={strokeColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-white">{score}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{status}</span>
          </div>
        </div>
      </div>

      {/* Breakdown metrics list */}
      <div className="flex-1 w-full space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-forest-900/20 pb-2">Index Metrics Breakdown</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {indicators.map((ind, idx) => (
            <div key={idx} className="bg-forest-950/20 p-3 rounded-xl border border-forest-900/10 flex justify-between items-center text-xs">
              <span className="text-slate-400">{ind.name}</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white">{ind.val}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  ind.level === "Good" || ind.level === "Clear" ? "bg-emerald-950 text-emerald-400" :
                  ind.level === "Stable" ? "bg-slate-900 text-slate-400" : "bg-amber-950 text-amber-400"
                }`}>
                  {ind.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
