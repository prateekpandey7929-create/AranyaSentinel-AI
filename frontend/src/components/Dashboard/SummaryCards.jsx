import React from "react";

function CardSkeleton() {
  return (
    <div className="glass-panel p-6 rounded-2xl animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-forest-900/40 rounded w-1/2"></div>
        <div className="h-6 w-6 bg-forest-900/40 rounded-full"></div>
      </div>
      <div className="h-8 bg-forest-900/40 rounded w-3/4"></div>
      <div className="h-3 bg-forest-900/40 rounded w-5/6"></div>
    </div>
  );
}

export default function SummaryCards({ metrics, loading, healthScore }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const lossPct = metrics?.forest_loss_percentage ?? 0.0;
  const areaHa = metrics?.changed_area_hectares ?? 0.0;
  const severity = metrics?.severity_score ?? "Low";
  const encroachments = metrics?.encroachment_count ?? 0;
  
  // Calculate default mockup health score if not set
  const score = healthScore ?? Math.max(15, Math.round(100 - (lossPct * 2.5) - (encroachments * 3)));
  const healthStatus = score > 80 ? "Healthy" : score > 50 ? "Moderate" : "Critical";
  const healthColor = score > 80 ? "text-emerald-400" : score > 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card 1: Forest Health Score */}
      <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Forest Health</span>
          <div className="p-2 bg-emerald-950/40 border border-emerald-900/30 rounded-xl group-hover:scale-110 transition duration-300">
            🌳
          </div>
        </div>
        <div className="mt-4">
          <h2 className={`text-4xl font-extrabold tracking-tight ${healthColor}`}>
            {score}/100
          </h2>
          <span className="text-xs text-slate-400 font-semibold mt-1 block">
            Status: <span className="font-bold">{healthStatus}</span>
          </span>
        </div>
      </div>

      {/* Card 2: Forest Loss */}
      <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Forest Loss</span>
          <div className="p-2 bg-red-950/40 border border-red-900/30 rounded-xl group-hover:scale-110 transition duration-300">
            🍂
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-4xl font-extrabold tracking-tight text-white">
            {lossPct}%
          </h2>
          <span className="text-xs text-slate-400 font-semibold mt-1 block">
            Deforested: <span className="text-rose-400 font-bold">{areaHa} Hectares</span>
          </span>
        </div>
      </div>

      {/* Card 3: Severity */}
      <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Severity Status</span>
          <div className="p-2 bg-amber-950/40 border border-amber-900/30 rounded-xl group-hover:scale-110 transition duration-300">
            ⚠️
          </div>
        </div>
        <div className="mt-4">
          <h2 className={`text-4xl font-extrabold tracking-tight ${
            severity === "High" ? "text-red-400" :
            severity === "Medium" ? "text-amber-400" : "text-emerald-400"
          }`}>
            {severity}
          </h2>
          <span className="text-xs text-slate-400 font-semibold mt-1 block">
            Classification index level
          </span>
        </div>
      </div>

      {/* Card 4: Encroachments */}
      <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Illegal Structures</span>
          <div className="p-2 bg-blue-950/40 border border-blue-900/30 rounded-xl group-hover:scale-110 transition duration-300">
            🏠
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-4xl font-extrabold tracking-tight text-white">
            {encroachments}
          </h2>
          <span className="text-xs text-slate-400 font-semibold mt-1 block">
            <span className="text-red-400 font-bold">YOLOv8 footprint scan</span>
          </span>
        </div>
      </div>
    </div>
  );
}
