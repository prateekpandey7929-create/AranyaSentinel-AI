import React from "react";

export default function TrendSummary({ data, trends, loading }) {
  if (loading || !data || data.length < 2) {
    return (
      <div className="glass-panel p-6 rounded-3xl animate-pulse h-[150px]">
        <div className="h-4 bg-forest-900/40 rounded w-1/4 mb-4"></div>
        <div className="h-10 bg-forest-900/40 rounded w-3/4"></div>
      </div>
    );
  }

  // Compare latest to previous
  const latest = data[0];
  const previous = data[1];

  const lossDiff = latest.forest_loss_percentage - previous.forest_loss_percentage;
  const healthDiff = latest.forest_health_score - previous.forest_health_score;
  const ndviDiff = latest.ndvi - previous.ndvi;
  const activityDiff = latest.human_activity_score - previous.human_activity_score;

  let summaryLines = [];
  
  if (lossDiff < 0) {
    summaryLines.push(`Forest loss reduced by ${Math.abs(lossDiff).toFixed(1)}%.`);
  } else if (lossDiff > 0) {
    summaryLines.push(`Forest loss increased by ${lossDiff.toFixed(1)}%.`);
  } else {
    summaryLines.push("Forest loss remained stable.");
  }

  if (ndviDiff > 0) summaryLines.push("NDVI improved.");
  else if (ndviDiff < 0) summaryLines.push("NDVI decreased.");
  
  if (healthDiff > 0) summaryLines.push("Forest Health increased.");
  else if (healthDiff < 0) summaryLines.push("Forest Health decreased.");

  if (Math.abs(activityDiff) < 5) summaryLines.push("Human Activity remained stable.");
  else if (activityDiff > 0) summaryLines.push("Human Activity increased.");
  else summaryLines.push("Human Activity decreased.");

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-4 relative overflow-hidden">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Trend Summary</h3>
        <span className="bg-forest-900 text-forest-300 font-mono text-[9px] px-2.5 py-1 rounded font-bold uppercase">
          Copilot Active
        </span>
      </div>
      
      <div className="text-slate-300 leading-relaxed bg-forest-950/20 p-4 rounded-xl border border-forest-900/10 text-sm">
        {summaryLines.join(" ")}
      </div>
    </div>
  );
}
