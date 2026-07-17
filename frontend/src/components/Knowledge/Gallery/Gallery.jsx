import React from "react";

export default function Gallery({ data }) {
  if (!data) return null;

  // Placeholder images for the gallery until backend media is integrated
  const images = [
    { id: 1, title: "Canopy View", style: "from-emerald-900/80 to-slate-900" },
    { id: 2, title: "Wildlife Cam 01", style: "from-amber-900/80 to-slate-900" },
    { id: 3, title: "Water Body", style: "from-blue-900/80 to-slate-900" },
    { id: 4, title: "Dense Core Area", style: "from-forest-900/80 to-slate-900" },
    { id: 5, title: "Periphery Buffer", style: "from-purple-900/80 to-slate-900" },
    { id: 6, title: "Terrain Topology", style: "from-stone-800/80 to-slate-900" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-forest-900/30 pb-2">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Forest Gallery</h3>
        <span className="text-[10px] text-slate-400 font-mono uppercase bg-forest-950/50 px-2 py-1 rounded">Media Sync: Pending</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map(img => (
          <div key={img.id} className="relative group overflow-hidden rounded-2xl aspect-video bg-slate-950 border border-forest-900/20 cursor-pointer">
            <div className={`absolute inset-0 bg-gradient-to-br ${img.style} opacity-40 group-hover:opacity-60 transition-opacity duration-300`}></div>
            
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <span className="text-xs font-bold text-white tracking-wide">{img.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
