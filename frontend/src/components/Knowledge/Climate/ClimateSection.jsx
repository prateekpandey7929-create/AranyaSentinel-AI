import React from "react";

export default function ClimateSection({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-2xl border border-forest-900/20 text-center">
          <span className="text-4xl mb-3">🌤️</span>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Climate Type</h4>
          <span className="text-white font-extrabold text-lg">{data.climate}</span>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-2xl border border-forest-900/20 text-center">
          <span className="text-4xl mb-3">🌧️</span>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Rainfall</h4>
          <span className="text-blue-400 font-extrabold text-2xl">{data.average_rainfall_mm} <span className="text-sm">mm</span></span>
        </div>
        
        <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-2xl border border-forest-900/20 text-center">
          <span className="text-4xl mb-3">🏔️</span>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Elevation</h4>
          <span className="text-white font-extrabold text-lg">{data.elevation_meters} <span className="text-sm text-slate-400">m</span></span>
        </div>

      </div>

      {data.rivers && data.rivers.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl">
          <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 border-b border-forest-900/30 pb-2">Major Rivers & Water Bodies</h4>
          <div className="flex flex-wrap gap-3">
            {data.rivers.map((river, i) => (
              <span key={i} className="bg-blue-950/30 text-blue-300 border border-blue-900/50 px-4 py-2 rounded-xl text-sm shadow-inner shadow-blue-900/20">
                🌊 {river}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
