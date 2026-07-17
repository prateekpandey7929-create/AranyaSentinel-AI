import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, ImageOverlay, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = "http://127.0.0.1:8000";

// Viewport modifier
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom]);
  return null;
}

// Hover coordinates tracker
function CoordinateTracker({ onMouseMove }) {
  useMapEvents({
    mousemove(e) {
      if (onMouseMove) {
        onMouseMove(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

export default function MapSection({ center, bounds, analysisResult, loading }) {
  const [activeLayer, setActiveLayer] = useState("heatmap"); // heatmap | mask | none
  const [hoverCoords, setHoverCoords] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleMouseMove = (lat, lng) => {
    setHoverCoords({ lat, lng });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl animate-pulse flex flex-col justify-center items-center h-[450px]">
        <div className="h-8 bg-forest-900/40 rounded w-1/4 mb-4"></div>
        <div className="w-full h-80 bg-forest-900/40 rounded-xl"></div>
      </div>
    );
  }

  // Set default coordinates if not loaded yet
  const mapCenter = center || [22.45, 78.20];
  const overlayBounds = bounds || [[22.43, 78.18], [22.47, 78.22]];

  let overlayUrl = null;
  if (analysisResult?.output_files) {
    if (activeLayer === "heatmap") {
      overlayUrl = `${API_BASE}${analysisResult.output_files.heatmap}?t=${Date.now()}`;
    } else if (activeLayer === "mask") {
      overlayUrl = `${API_BASE}${analysisResult.output_files.change_mask}?t=${Date.now()}`;
    }
  }

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-slate-950/95 flex flex-col p-6 space-y-4"
    : "glass-panel p-6 rounded-3xl flex flex-col space-y-4 relative overflow-hidden";

  return (
    <div className={containerClasses}>
      {/* Title / Toolbar */}
      <div className="flex justify-between items-center border-b border-forest-900/20 pb-3 z-10">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Interactive GIS Analysis Map</h3>
          <p className="text-[10px] text-slate-400">Interact with model segmentation overlays directly</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Layer toggles */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-forest-900/30">
            {["heatmap", "mask", "none"].map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`text-[9px] uppercase font-bold px-2.5 py-1.5 rounded transition ${
                  activeLayer === layer ? "bg-forest-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {layer}
              </button>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-forest-900/30 rounded-lg text-slate-300 text-xs transition"
          >
            {isFullscreen ? " Exit" : " Fullscreen"}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative flex-1 w-full rounded-2xl border border-forest-900/20 overflow-hidden min-h-[350px] bg-slate-950">
        <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {overlayUrl && (
            <ImageOverlay
              url={overlayUrl}
              bounds={overlayBounds}
              opacity={activeLayer === "heatmap" ? 0.65 : 0.8}
            />
          )}
          <CoordinateTracker onMouseMove={handleMouseMove} />
          <ChangeView center={mapCenter} zoom={13} />
        </MapContainer>

        {/* Floating Readouts */}
        {hoverCoords && (
          <div className="absolute bottom-4 left-4 z-[99] bg-slate-950/90 border border-forest-900/50 p-2.5 rounded-lg text-[10px] text-slate-300 font-mono shadow-md">
             Lat: {hoverCoords.lat.toFixed(5)}, Lon: {hoverCoords.lng.toFixed(5)}
          </div>
        )}

        {/* Legend */}
        {activeLayer !== "none" && overlayUrl && (
          <div className="absolute top-4 right-4 z-[99] bg-slate-950/90 border border-forest-900/50 p-3 rounded-lg text-[10px] text-slate-300 space-y-2 shadow-md">
            <span className="font-bold text-slate-200 block border-b border-forest-900/30 pb-1.5 uppercase">Loss Legend</span>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>Critical Deforestation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span>Medium NDVI Shift</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <span>Stable Canopy</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
