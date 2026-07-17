import React from "react";

export default function HistorySection({ events }) {
  const activeEvents = events ?? [
    { date: "17 July 2026", title: "Forest Analysis Completed", detail: "Kanha Sanctuary scan completed. Loss index: 4.85%. GEE bands sync successful." },
    { date: "16 July 2026", title: "Canopy Thresholds Modified", detail: "NDVI loss threshold updated dynamically to 0.15 without server restarts." },
    { date: "15 July 2026", title: "Forest Analysis Completed", detail: "Satpura Tiger Reserve baseline scan completed. Loss index: 7.84%." },
    { date: "14 July 2026", title: "System Environment Deployed", detail: "FastAPI server preloaded PyTorch U-Net weights on CUDA 0 successfully." }
  ];

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      <div className="border-b border-forest-900/20 pb-3">
        <h3 className="text-base font-bold text-white uppercase tracking-wider">Analysis Execution History</h3>
        <p className="text-[10px] text-slate-400">Chronological history log of activities performed in current session</p>
      </div>

      <div className="relative pl-6 border-l border-forest-900/30 space-y-6 text-xs select-none">
        {activeEvents.map((ev, idx) => (
          <div key={idx} className="relative">
            {/* Timeline bullet */}
            <div className="absolute -left-[30px] top-0.5 w-4 h-4 bg-slate-950 border-2 border-forest-500 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-forest-500 rounded-full animate-ping"></div>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-mono font-bold block">{ev.date}</span>
              <h4 className="text-white font-bold">{ev.title}</h4>
              <p className="text-slate-400 leading-relaxed">{ev.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
