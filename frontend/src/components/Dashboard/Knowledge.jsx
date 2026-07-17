import React, { useState } from "react";

export default function Knowledge({ knowledgeData }) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabContent = knowledgeData ?? {
    overview: {
      title: "Satpura Tiger Reserve Ecosystem",
      desc: "Satpura Tiger Reserve (STR) is a unique forest ecosystem located in the Hoshangabad district of Madhya Pradesh, India. It spans over 2,200 square kilometers, presenting a rich bio-diverse habitat with unique geographical features such as sandstone peaks, deep gorges, and dense canopy woodlands.",
      highlights: ["Total Area: 2,133.30 sq km", "Declared Tiger Reserve: 1999", "Ecosystem type: Tropical Dry Deciduous & Moist Deciduous"]
    },
    species: {
      title: "Critically Monitored Species",
      desc: "STR serves as a vital corridor for major Indian wildlife species. AI model mapping focuses on habitat preservation of indicator species that represent overall canopy health.",
      highlights: ["Royal Bengal Tiger (Indicator Species)", "Indian Leopard & Wild Dog (Dhole)", "Barasingha (Swamp Deer) & Malabar Giant Squirrel"]
    },
    vegetation: {
      title: "Flora & Canopy Vegetation Classifications",
      desc: "The forest canopy is dominated by dense woodlands and deciduous flora. NDVI analysis tracks changes across Sal and Teak patches, which are vulnerable to timber erosion and illegal logging footprint shifts.",
      highlights: ["Dominant tree species: Teak (Tectona grandis) & Sal (Shorea robusta)", "Medicinal plants: Over 1,300 species identified", "Bamboo woodlands in buffer gorges"]
    },
    climate: {
      title: "Micro-climate Conditions",
      desc: "Experience extreme seasonal climate variations, which affect NDVI values. Dry summers (March to May) lead to natural deciduous leaf shed, causing drops in NDVI that are cloud-masked and filtered to avoid false deforestation alerts.",
      highlights: ["Temperature range: 10°C (Winter) to 46°C (Summer)", "Average rainfall: 1,200mm - 1,500mm", "Monsoon season: June to September"]
    },
    importance: {
      title: "Ecological Importance",
      desc: "The reserve acts as a major carbon sink and watershed catcher for Central India. It hosts the catchment area of the Tawa Reservoir, protecting local groundwater basins and regulating seasonal temperatures.",
      highlights: ["Major carbon capture zone in Central India", "Protects river system watersheds (Tawa, Denwa rivers)", "Sustains regional weather cycles"]
    },
    protected: {
      title: "Legal Protected Status & Zonation",
      desc: "STR is divided into Core (National Park) and Buffer zones. AI encroachment monitoring primarily targets core perimeter fences to prevent illegal construction footprints in zones where human presence is strictly prohibited.",
      highlights: ["Core area protection: Wildlife Protection Act 1972", "No human settlement allowed in Core Zone", "Buffer zone permits restricted sustainable community farming"]
    }
  };

  const activeData = tabContent[activeTab] || tabContent.overview;

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      <div className="border-b border-forest-900/20 pb-3">
        <h3 className="text-base font-bold text-white uppercase tracking-wider">Forest Ecosystem Knowledge Explorer</h3>
        <p className="text-[10px] text-slate-400">Database references for local geological and biological profiles</p>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-1 bg-slate-950/80 p-1 rounded-xl border border-forest-900/20 max-w-full overflow-x-auto">
        {Object.keys(tabContent).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[10px] uppercase font-bold py-2 px-4 rounded-lg transition ${
              activeTab === tab ? "bg-forest-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {tab === "protected" ? "Protected Status" : tab}
          </button>
        ))}
      </div>

      {/* Tab content panel */}
      <div className="bg-forest-950/10 p-5 rounded-2xl border border-forest-900/10 text-xs min-h-[160px] flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-emerald-400">{activeData.title}</h4>
          <p className="text-slate-300 leading-relaxed font-sans">{activeData.desc}</p>
        </div>

        <div className="pt-3 border-t border-forest-900/10">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-2">Highlights</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeData.highlights.map((hl, idx) => (
              <div key={idx} className="bg-slate-950/50 p-2.5 rounded-lg border border-forest-900/10 text-slate-300 font-semibold flex items-center space-x-2">
                <span>🟢</span>
                <span>{hl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
