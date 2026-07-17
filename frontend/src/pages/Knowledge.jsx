import React, { useState, useEffect } from "react";
import axios from "axios";

// Subcomponents
import SearchBar from "../components/Knowledge/Search/SearchBar";
import Overview from "../components/Knowledge/Overview/Overview";
import SpeciesSection from "../components/Knowledge/Species/SpeciesSection";
import ClimateSection from "../components/Knowledge/Climate/ClimateSection";
import ImportanceSection from "../components/Knowledge/Importance/ImportanceSection";
import Gallery from "../components/Knowledge/Gallery/Gallery";

const API_BASE = "http://127.0.0.1:8000";

export default function Knowledge() {
  const [loading, setLoading] = useState(true);
  const [forests, setForests] = useState([]);
  const [selectedForest, setSelectedForest] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Fetch initial list of all forests
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/knowledge/`);
        setForests(res.data);
        if (res.data.length > 0) {
          setSelectedForest(res.data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch knowledge base:", err);
        setError("Failed to load Knowledge Base.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleSearchSelect = async (forest_id) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/knowledge/${forest_id}`);
      setSelectedForest(res.data);
      setActiveTab("overview");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-red-400">
        <div className="glass-panel p-6 rounded-2xl">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-forest-900/30 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-3">
            <span className="text-4xl">📚</span> Forest Knowledge Explorer
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-mono">
            Comprehensive encyclopedia of critical ecosystems.
          </p>
        </div>
        <div className="w-full md:w-1/3">
          <SearchBar forests={forests} onSelect={handleSearchSelect} />
        </div>
      </div>

      {!selectedForest && loading ? (
        <div className="animate-pulse flex flex-col space-y-4 mt-8">
          <div className="h-40 bg-forest-900/30 rounded-3xl"></div>
          <div className="h-64 bg-forest-900/30 rounded-3xl"></div>
        </div>
      ) : selectedForest ? (
        <>
          {/* Forest Header Banner */}
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="z-10 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-emerald-900 text-emerald-300 font-mono text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">
                  {selectedForest.protected_status}
                </span>
                {selectedForest.unesco_status && (
                  <span className="bg-amber-900 text-amber-300 font-mono text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">
                    UNESCO
                  </span>
                )}
              </div>
              <h2 className="text-4xl font-extrabold text-white">{selectedForest.forest_name}</h2>
              <div className="flex items-center gap-2 mt-2 text-slate-400 text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {selectedForest.district}, {selectedForest.state}, {selectedForest.country}
              </div>
            </div>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4 z-10 w-full md:w-auto">
              <div className="bg-forest-950/40 border border-forest-900/20 p-3 rounded-xl flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Area</span>
                <span className="text-white font-bold text-lg">{selectedForest.area_sq_km} <span className="text-xs text-slate-500">km²</span></span>
              </div>
              <div className="bg-forest-950/40 border border-forest-900/20 p-3 rounded-xl flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Est.</span>
                <span className="text-white font-bold text-lg">{selectedForest.established_year}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 border-b border-forest-900/30 overflow-x-auto custom-scrollbar pb-1">
            {["overview", "species", "climate", "importance", "gallery"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === tab ? "bg-forest-600 text-white" : "text-slate-400 hover:text-white hover:bg-forest-900/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div className="min-h-[400px]">
            {loading ? (
              <div className="glass-panel p-6 rounded-3xl animate-pulse h-64"></div>
            ) : (
              <>
                {activeTab === "overview" && <Overview data={selectedForest} />}
                {activeTab === "species" && <SpeciesSection data={selectedForest} />}
                {activeTab === "climate" && <ClimateSection data={selectedForest} />}
                {activeTab === "importance" && <ImportanceSection data={selectedForest} />}
                {activeTab === "gallery" && <Gallery data={selectedForest} />}
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
