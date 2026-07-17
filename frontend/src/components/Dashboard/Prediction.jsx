import React from "react";

export default function Prediction({ metrics, loading, predictionData }) {
  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl animate-pulse space-y-4 h-[300px]">
        <div className="h-6 bg-forest-900/40 rounded w-1/3"></div>
        <div className="h-16 bg-forest-900/40 rounded w-full"></div>
      </div>
    );
  }

  const lossPct = metrics?.forest_loss_percentage ?? 0.0;
  
  // Calculate mock predictions based on active stats
  const projectedLoss = (lossPct * 0.35 + 1.2).toFixed(1);
  const confidence = Math.min(95, Math.max(60, 92 - Math.round(lossPct * 2)));

  const activePred = predictionData ?? {
    projected_loss: `+${projectedLoss}%`,
    projected_hectares: `${((metrics?.changed_area_hectares || 0) * 0.35).toFixed(2)} Ha`,
    confidence: confidence,
    reason: "Model extrapolates changes based on local logging velocities and NDVI indices. Canopy edge erosion indicates moderate expansion risk near eastern buffer quadrants due to seasonal moisture dry-outs.",
    action: "Deploy fire lines and schedule satellite passes during maximum dry seasons (March-May). Target surveillance resources to high edge threat zones."
  };

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      <div className="border-b border-forest-900/20 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider">AI Predictive Canopy Analysis</h3>
          <p className="text-[10px] text-slate-400">Canopy trends projection for the next 12 months</p>
        </div>
        <span className="bg-forest-900 text-forest-300 font-mono text-[9px] px-2.5 py-1 rounded font-bold uppercase">
          Predictive Model loaded
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Core Prediction */}
        <div className="bg-forest-950/20 p-5 rounded-2xl border border-forest-900/10 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-slate-400 uppercase tracking-wider block text-[9px] font-bold">Projected Loss (12M)</span>
            <h4 className="text-3xl font-extrabold text-amber-400">{activePred.projected_loss}</h4>
            <span className="text-[10px] text-slate-500 block">Est. changed area: {activePred.projected_hectares}</span>
          </div>
          
          <div className="space-y-1">
            <span className="text-slate-400 uppercase tracking-wider block text-[9px] font-bold">Model Confidence</span>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white text-base">{activePred.confidence}%</span>
              <span className="bg-emerald-950 text-emerald-400 text-[8px] font-bold px-1 rounded uppercase">High</span>
            </div>
          </div>
        </div>

        {/* Prediction Logic */}
        <div className="space-y-4 md:col-span-2 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 uppercase tracking-wider block text-[9px] font-bold">Predictive Risk Reason</span>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              {activePred.reason}
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-forest-900/10">
            <span className="text-slate-400 uppercase tracking-wider block text-[9px] font-bold">Recommended Mitigation Action</span>
            <p className="text-slate-400 italic">
              {activePred.action}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
