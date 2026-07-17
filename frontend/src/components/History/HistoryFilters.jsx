import React from "react";

export default function HistoryFilters({ filters, setFilters }) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Filters</span>
        
        {/* Forest Name Filter */}
        <select 
          value={filters.forestName}
          onChange={(e) => handleFilterChange("forestName", e.target.value)}
          className="bg-slate-900 border border-forest-900/30 text-white text-xs rounded-lg focus:ring-forest-500 focus:border-forest-500 block p-2.5"
        >
          <option value="All">All Forests</option>
          <option value="Satpura Tiger Reserve">Satpura Tiger Reserve</option>
          <option value="Kanha Sanctuary">Kanha Sanctuary</option>
          <option value="Pench National Park">Pench National Park</option>
        </select>

        {/* Severity Filter */}
        <select
          value={filters.severity}
          onChange={(e) => handleFilterChange("severity", e.target.value)}
          className="bg-slate-900 border border-forest-900/30 text-white text-xs rounded-lg focus:ring-forest-500 focus:border-forest-500 block p-2.5"
        >
          <option value="All">All Severities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>
      
      <div className="text-xs text-slate-400 font-mono">
        Active Filters: {filters.forestName !== "All" || filters.severity !== "All" ? "Custom" : "Default"}
      </div>
    </div>
  );
}
