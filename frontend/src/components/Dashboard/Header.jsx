import React from "react";
import LanguageSwitcher from "../LanguageSwitcher";
import NotificationBell from "../Notifications/NotificationBell";

export default function Header({ config, lastAnalysisTime }) {
  const forestName = config?.roi?.name || "Satpura Tiger Reserve";
  const lat = config?.roi?.lat || 22.45;
  const lon = config?.roi?.lon || 78.20;
  
  const beforeRange = config?.dates?.before 
    ? `${config.dates.before.start} to ${config.dates.before.end}`
    : "N/A";
  const afterRange = config?.dates?.after 
    ? `${config.dates.after.start} to ${config.dates.after.end}`
    : "N/A";

  return (
    <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between border border-forest-900/30 shadow-2xl">
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-forest-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
      
      <div className="space-y-2 z-10">
        <div className="flex items-center space-x-2">
          <span className="bg-forest-900/60 text-forest-300 border border-forest-500/25 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
            Active Forest Center
          </span>
          <span className="text-slate-400 text-xs font-mono">
            Lat: {lat.toFixed(4)} | Lon: {lon.toFixed(4)}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          {forestName}
        </h1>
        <p className="text-slate-300 text-sm max-w-xl font-medium">
          AranyaSentinel AI Forest Monitoring Dashboard
        </p>
        {/* Right side tools */}
        <div className="flex items-center gap-4">
          <NotificationBell />
          <LanguageSwitcher />
          
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400"></div>
          </div>
        </div>
      </div>

      <div className="mt-4 md:mt-0 flex flex-col items-end space-y-1.5 text-right z-10">
        <div className="text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Analysis Period:</span> {beforeRange} vs {afterRange}
        </div>
        <div className="text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Last Analysis Run:</span> {lastAnalysisTime || "No run executed yet"}
        </div>
      </div>
    </div>
  );
}
