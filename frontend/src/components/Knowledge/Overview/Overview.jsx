import React from "react";

export default function Overview({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-8 rounded-3xl">
        <h3 className="text-xl font-bold text-white mb-4">Overview</h3>
        <p className="text-slate-300 leading-relaxed text-sm md:text-base">{data.overview}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Geography & Stats */}
        <div className="glass-panel p-6 rounded-3xl">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-forest-900/30 pb-2">Location & Geography</h4>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">State</span>
              <span className="text-white font-bold text-sm">{data.state}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">District</span>
              <span className="text-white font-bold text-sm">{data.district}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Elevation</span>
              <span className="text-white font-bold text-sm">{data.elevation_meters} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Total Area</span>
              <span className="text-white font-bold text-sm">{data.area_sq_km} sq km</span>
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="glass-panel p-6 rounded-3xl">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-forest-900/30 pb-2">Classification</h4>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Established</span>
              <span className="text-white font-bold text-sm">{data.established_year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Protected Status</span>
              <span className="text-white font-bold text-sm text-right">{data.protected_status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Forest Type</span>
              <span className="text-white font-bold text-sm text-right">{data.forest_type}</span>
            </div>
            {data.unesco_status && (
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">UNESCO</span>
                <span className="text-amber-400 font-bold text-sm">{data.unesco_status}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
