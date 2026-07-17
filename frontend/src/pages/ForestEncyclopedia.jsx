import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export default function ForestEncyclopedia() {
  const [lat, setLat] = useState("22.334");
  const [lon, setLon] = useState("80.611");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!lat || !lon) {
      setError("Please enter valid latitude and longitude coordinates.");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);

    axios.post(`${API_BASE}/forest-knowledge`, {
      latitude: parseFloat(lat),
      longitude: parseFloat(lon)
    })
      .then(res => {
        if (res.data) {
          setData(res.data);
        } else {
          setError("No encyclopedic information could be resolved for this region.");
        }
      })
      .catch(err => {
        console.error("Forest knowledge fetch failed:", err);
        setError("Failed to query forest knowledge server. Please check coordinates and try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Forest Encyclopedia</h1>
        <p className="text-slate-400 text-sm mt-1">
          Explore ecological profiles, dominant flora, fauna, and local hydrology of any region in India.
        </p>
      </div>

      {/* Input Coordinate Form */}
      <div className="glass-panel p-6 rounded-3xl border border-forest-900/20">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-bold uppercase block">Latitude</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="e.g. 22.334"
              className="w-full bg-slate-950/80 border border-forest-900/30 rounded-xl px-4 py-3 text-white font-semibold text-sm outline-none focus:border-forest-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-bold uppercase block">Longitude</label>
            <input
              type="number"
              step="any"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="e.g. 80.611"
              className="w-full bg-slate-950/80 border border-forest-900/30 rounded-xl px-4 py-3 text-white font-semibold text-sm outline-none focus:border-forest-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest-900 text-white font-bold rounded-xl py-3 text-sm hover:bg-forest-800 transition-all duration-200 shadow-lg shadow-forest-950/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 border border-forest-500/20"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Querying Ecological DB...</span>
              </span>
            ) : (
              <span> Search Forest Region</span>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-950/40 border border-red-500/30 text-red-200 text-xs px-4 py-3 rounded-xl font-semibold">
             {error}
          </div>
        )}
      </div>

      {/* Loading Placeholder */}
      {loading && (
        <div className="glass-panel p-12 rounded-3xl text-center text-slate-400 animate-pulse flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-forest-500 border-forest-900/20 animate-spin"></div>
          <span className="font-semibold text-sm">Searching geographical coordinates in spatial registry...</span>
        </div>
      )}

      {/* Encyclopedia details display */}
      {data && !loading && (
        <div className="glass-panel p-8 rounded-3xl space-y-8 border border-forest-900/30 relative overflow-hidden animate-fade-in">
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>

          {/* Header section */}
          <div className="border-b border-forest-900/20 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="bg-forest-950/60 text-forest-300 border border-forest-500/25 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase inline-block">
                 Geographical Registry Profile
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                {data.name}
              </h2>
              <p className="text-xs text-slate-400 font-semibold">
                 {data.geographical_location} | {data.district}, {data.state}, {data.country}
              </p>
            </div>
            <span className="bg-slate-900/90 border border-forest-900/40 px-4 py-2.5 rounded-xl text-xs text-slate-300 font-extrabold shadow-lg">
               {data.protected_status}
            </span>
          </div>

          {/* Core metadata grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed">
            {/* Left Col */}
            <div className="space-y-6">
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-forest-900/10 space-y-3">
                <span className="text-forest-300 font-extrabold uppercase tracking-wider block text-[10px]">
                   Forest Type & Vegetation
                </span>
                <p className="text-slate-300 font-semibold text-sm">
                  <strong>Type:</strong> {data.forest_type}
                </p>
                <p className="text-slate-400">
                  <strong>Major Vegetation:</strong> {data.major_vegetation}
                </p>
              </div>

              <div className="bg-slate-950/60 p-5 rounded-2xl border border-forest-900/10 space-y-3">
                <span className="text-forest-300 font-extrabold uppercase tracking-wider block text-[10px]">
                   Wildlife & Biodiversity (Flora & Fauna)
                </span>
                <p className="text-slate-300 font-semibold text-sm">
                  <strong>Biodiversity Index:</strong> {data.biodiversity}
                </p>
                <p className="text-slate-400">
                  <strong>Key Species:</strong> {data.important_flora_and_fauna}
                </p>
              </div>
            </div>

            {/* Right Col */}
            <div className="space-y-6">
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-forest-900/10 space-y-3">
                <span className="text-forest-300 font-extrabold uppercase tracking-wider block text-[10px]">
                   Dominant Canopy Tree Species
                </span>
                <div className="flex flex-wrap gap-2.5 pt-1.5">
                  {data.dominant_tree_species.map((tree, idx) => (
                    <span key={idx} className="bg-forest-900/30 text-forest-300 border border-forest-500/20 px-3 py-1.5 rounded-lg font-extrabold text-[10px]">
                       {tree}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/60 p-5 rounded-2xl border border-forest-900/10 space-y-3">
                <span className="text-forest-300 font-extrabold uppercase tracking-wider block text-[10px]">
                   Climatology & Hydrological Profile
                </span>
                <p className="text-slate-300 font-semibold">
                  <strong>Climate Range:</strong> {data.climate}
                </p>
                <p className="text-slate-300 font-semibold">
                  <strong>Annual Rainfall:</strong> {data.annual_rainfall}
                </p>
                <p className="text-slate-400">
                  <strong>Perennial Water Bodies:</strong> {data.nearby_water_bodies}
                </p>
              </div>
            </div>
          </div>

          {/* Full block summaries */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            <div className="md:col-span-2 bg-slate-950/60 p-5 rounded-2xl border border-forest-900/10 space-y-2">
              <span className="text-forest-300 font-extrabold uppercase tracking-wider block text-[10px]">
                 Ecological Significance
              </span>
              <p className="text-slate-300 leading-relaxed font-semibold text-sm">
                {data.ecological_importance}
              </p>
            </div>

            <div className="md:col-span-1 bg-forest-950/20 p-5 rounded-2xl border border-forest-500/25 space-y-2 relative overflow-hidden">
              <span className="text-emerald-400 font-black uppercase tracking-wider block text-[10px]">
                 Did You Know?
              </span>
              <p className="text-slate-200 leading-relaxed font-semibold italic">
                {data.why_famous}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
