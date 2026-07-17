import React from "react";

function SpeciesList({ title, speciesList, icon, alertStyle }) {
  if (!speciesList || speciesList.length === 0) return null;

  return (
    <div className={`glass-panel p-6 rounded-3xl ${alertStyle || ""}`}>
      <div className="flex items-center gap-3 mb-4 border-b border-forest-900/20 pb-2">
        <span className="text-xl">{icon}</span>
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {speciesList.map((species, i) => (
          <span key={i} className="bg-slate-900 border border-forest-900/40 text-slate-300 text-xs px-3 py-1.5 rounded-lg shadow-sm">
            {species}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SpeciesSection({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Vegetation Overview */}
      <div className="glass-panel p-6 rounded-3xl bg-forest-950/40">
        <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">Vegetation Profile</h4>
        <p className="text-slate-300 text-sm">{data.vegetation_type}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpeciesList title="Major Trees & Flora" speciesList={data.major_trees} icon="" />
        <SpeciesList title="Major Wildlife" speciesList={data.major_animals} icon="" />
        <SpeciesList title="Bird Species" speciesList={data.bird_species} icon="" />
        
        <div className="space-y-6">
          <SpeciesList 
            title="Threatened Species" 
            speciesList={data.threatened_species} 
            icon="" 
            alertStyle="border border-amber-900/50 shadow-[0_0_15px_rgba(245,158,11,0.05)]" 
          />
          <SpeciesList 
            title="Endangered Species" 
            speciesList={data.endangered_species} 
            icon="" 
            alertStyle="border border-rose-900/50 shadow-[0_0_15px_rgba(244,63,94,0.05)]" 
          />
        </div>
      </div>
    </div>
  );
}
