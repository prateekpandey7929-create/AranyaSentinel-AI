import React from "react";

export default function HistoryTimeline({ historyData, loading }) {
  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl animate-pulse h-[400px]">
         <div className="h-6 bg-forest-900/40 rounded w-1/4 mb-8"></div>
         <div className="space-y-6">
           <div className="h-16 bg-forest-900/40 rounded w-full"></div>
           <div className="h-16 bg-forest-900/40 rounded w-full"></div>
         </div>
      </div>
    );
  }

  if (!historyData || historyData.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-3xl flex items-center justify-center h-[200px] text-slate-400">
        No historical data matches the current filters.
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      <div className="border-b border-forest-900/20 pb-3">
        <h3 className="text-base font-bold text-white uppercase tracking-wider">Analysis Execution Timeline</h3>
        <p className="text-[10px] text-slate-400">Chronological history log of all completed scans (Newest first)</p>
      </div>

      <div className="relative pl-6 border-l border-forest-900/30 space-y-6 text-xs max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
        {historyData.map((ev, idx) => (
          <div key={idx} className="relative bg-forest-950/20 p-4 rounded-xl border border-forest-900/10 hover:border-forest-500/30 transition">
            {/* Timeline bullet */}
            <div className="absolute -left-[34px] top-4 w-4 h-4 bg-slate-950 border-2 border-forest-500 rounded-full flex items-center justify-center">
              {idx === 0 && <div className="w-1.5 h-1.5 bg-forest-500 rounded-full animate-ping"></div>}
            </div>
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-900 px-2 py-1 rounded">{ev.date}</span>
                  <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${
                    ev.status === "Completed" ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"
                  }`}>
                    {ev.status}
                  </span>
                </div>
                <h4 className="text-white font-bold text-sm">{ev.forest_name}</h4>
                <p className="text-slate-400">ID: <span className="font-mono text-slate-300">{ev.id}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px]">
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold uppercase">Loss</span>
                  <span className="text-white font-bold">{ev.forest_loss_percentage}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold uppercase">Health</span>
                  <span className="text-white font-bold">{ev.forest_health_score}/100</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold uppercase">Severity</span>
                  <span className={`font-bold ${ev.severity === "High" ? "text-rose-400" : ev.severity === "Medium" ? "text-amber-400" : "text-emerald-400"}`}>
                    {ev.severity}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold uppercase">Activity</span>
                  <span className="text-white font-bold">{ev.human_activity_score}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
