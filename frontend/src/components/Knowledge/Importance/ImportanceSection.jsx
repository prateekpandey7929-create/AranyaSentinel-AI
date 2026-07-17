import React from "react";

export default function ImportanceSection({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Ecological Importance */}
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-emerald-500">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span></span> Ecological Significance
          </h4>
          <p className="text-slate-300 text-sm leading-relaxed">{data.ecological_importance}</p>
        </div>

        {/* Tourism Importance */}
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-amber-500">
          <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span></span> Tourism & Attractions
          </h4>
          <p className="text-slate-300 text-sm leading-relaxed">{data.tourism_importance}</p>
        </div>

      </div>

      {/* Interesting Facts */}
      {data.interesting_facts && data.interesting_facts.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl">
          <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-forest-900/30 pb-2">
            <span></span> Interesting Facts
          </h4>
          <ul className="space-y-3 mt-4">
            {data.interesting_facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-purple-400 mt-0.5">•</span>
                <span className="text-slate-300 text-sm">{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
