import React, { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function Comparison({ historyData, loading }) {
  const [dateA, setDateA] = useState("");
  const [dateB, setDateB] = useState("");

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl animate-pulse h-[400px]"></div>
    );
  }

  if (!historyData || historyData.length < 2) {
    return null;
  }

  // Set initial default dates if empty
  const currentA = dateA || historyData[1]?.id;
  const currentB = dateB || historyData[0]?.id;

  const dataA = historyData.find(d => d.id === currentA) || historyData[1];
  const dataB = historyData.find(d => d.id === currentB) || historyData[0];

  const compareRow = (label, valA, valB, isInverse = false) => {
    let diff = parseFloat(valB) - parseFloat(valA);
    const isPositive = diff > 0;
    const isGood = isInverse ? !isPositive : isPositive;
    let color = "text-slate-400";
    if (diff !== 0) {
      color = isGood ? "text-emerald-400" : "text-rose-400";
    }

    return (
      <div className="flex justify-between items-center py-2 border-b border-forest-900/20 text-xs">
        <span className="text-slate-400 w-1/3">{label}</span>
        <span className="text-white font-bold w-1/4 text-center">{valA}</span>
        <span className="text-white font-bold w-1/4 text-center">{valB}</span>
        <span className={`w-1/6 text-right font-bold ${color}`}>
          {diff !== 0 ? (isPositive ? `+${diff.toFixed(2)}` : diff.toFixed(2)) : "-"}
        </span>
      </div>
    );
  };

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      <div className="border-b border-forest-900/20 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Side-by-Side Comparison</h3>
          <p className="text-[10px] text-slate-400">Compare metrics and images between two distinct dates</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Stats Compare */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between gap-4 mb-6">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Date A (Baseline)</label>
              <select 
                value={currentA}
                onChange={e => setDateA(e.target.value)}
                className="w-full bg-slate-900 border border-forest-900/30 text-white text-xs rounded-lg p-2"
              >
                {historyData.map(h => (
                  <option key={h.id} value={h.id}>{h.date} - {h.forest_name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Date B (Compare to)</label>
              <select 
                value={currentB}
                onChange={e => setDateB(e.target.value)}
                className="w-full bg-slate-900 border border-forest-900/30 text-white text-xs rounded-lg p-2"
              >
                {historyData.map(h => (
                  <option key={h.id} value={h.id}>{h.date} - {h.forest_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-forest-950/20 rounded-2xl border border-forest-900/10 p-4">
            <div className="flex justify-between items-center pb-2 border-b border-forest-900/40 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="w-1/3">Metric</span>
              <span className="w-1/4 text-center">Date A</span>
              <span className="w-1/4 text-center">Date B</span>
              <span className="w-1/6 text-right">Diff</span>
            </div>
            
            <div className="pt-2">
              {compareRow("Forest Loss %", dataA.forest_loss_percentage, dataB.forest_loss_percentage, true)}
              {compareRow("Health Score", dataA.forest_health_score, dataB.forest_health_score, false)}
              {compareRow("NDVI Avg", dataA.ndvi, dataB.ndvi, false)}
              {compareRow("Encroachments", dataA.illegal_structures, dataB.illegal_structures, true)}
              {compareRow("Activity Score", dataA.human_activity_score, dataB.human_activity_score, true)}
            </div>
          </div>
        </div>

        {/* Right Side: Visual Compare */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="flex flex-col space-y-2">
              <span className="text-center text-xs font-bold text-slate-300 bg-slate-900 py-1 rounded">Date A Heatmap</span>
              <div className="relative flex-1 bg-slate-950 rounded-xl overflow-hidden border border-forest-900/20 min-h-[200px]">
                {dataA?.output_files?.heatmap && (
                  <img src={`${API_BASE}${dataA.output_files.heatmap}`} className="w-full h-full object-cover" alt="Date A Heatmap" />
                )}
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="text-center text-xs font-bold text-slate-300 bg-slate-900 py-1 rounded">Date B Heatmap</span>
              <div className="relative flex-1 bg-slate-950 rounded-xl overflow-hidden border border-forest-900/20 min-h-[200px]">
                {dataB?.output_files?.heatmap && (
                  <img src={`${API_BASE}${dataB.output_files.heatmap}`} className="w-full h-full object-cover" alt="Date B Heatmap" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
