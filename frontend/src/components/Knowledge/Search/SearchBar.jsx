import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export default function SearchBar({ forests, onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    
    // Auto-complete locally using the passed 'forests' list
    const q = query.toLowerCase();
    const filtered = forests.filter(f => 
      f.forest_name.toLowerCase().includes(q) || 
      f.state.toLowerCase().includes(q)
    );
    setSuggestions(filtered);
    setShowDropdown(true);
  }, [query, forests]);

  const handleSelect = (forest) => {
    setQuery("");
    setShowDropdown(false);
    onSelect(forest.forest_id);
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      </div>
      <input
        type="text"
        className="bg-slate-900 border border-forest-900/40 text-white text-sm rounded-xl focus:ring-forest-500 focus:border-forest-500 block w-full pl-10 p-3 shadow-inner shadow-black/20 placeholder-slate-500 transition-all"
        placeholder="Search forest or state..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // delay for click
      />
      
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-forest-900/50 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
          {suggestions.map((f, i) => (
            <div 
              key={i} 
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent focus loss just in case
                handleSelect(f);
              }}
              className="p-3 hover:bg-forest-700/50 cursor-pointer border-b border-forest-900/20 last:border-0 flex justify-between items-center transition-colors"
            >
              <div>
                <div className="text-white font-bold text-sm">{f.forest_name}</div>
                <div className="text-slate-400 text-[10px] uppercase font-mono">{f.state}</div>
              </div>
              <span className="text-[9px] bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-700">{f.protected_status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
