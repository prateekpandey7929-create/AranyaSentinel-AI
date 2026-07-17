import React, { useState, useRef } from "react";

export default function ImageCompare({ beforeUrl, afterUrl, loading }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [zoomScale, setZoomScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const handleSliderChange = (e) => {
    setSliderPosition(e.target.value);
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.2, 1));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const downloadImage = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl animate-pulse flex flex-col justify-center items-center h-[400px]">
        <div className="h-8 bg-forest-900/40 rounded w-1/4 mb-4"></div>
        <div className="w-full h-64 bg-forest-900/40 rounded-xl"></div>
      </div>
    );
  }

  if (!beforeUrl || !afterUrl) {
    return (
      <div className="glass-panel p-6 rounded-3xl text-center flex flex-col justify-center items-center h-[350px] text-slate-400">
        <span>📸 No imagery outputs found. Run an analysis run first.</span>
      </div>
    );
  }

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-slate-950/95 flex flex-col p-6 space-y-4"
    : "glass-panel p-6 rounded-3xl flex flex-col space-y-4 relative overflow-hidden";

  return (
    <div className={containerClasses} ref={containerRef}>
      {/* Title & Toolbar */}
      <div className="flex justify-between items-center border-b border-forest-900/20 pb-3 z-10">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Before / After Imagery Slider</h3>
          <p className="text-[10px] text-slate-400">Drag center slider to verify changes dynamically</p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-forest-900/30 rounded-lg text-slate-300 text-xs transition font-bold"
            title="Zoom Out"
          >
            ➖
          </button>
          <span className="text-[10px] text-slate-400 font-mono w-10 text-center">{Math.round(zoomScale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-forest-900/30 rounded-lg text-slate-300 text-xs transition font-bold"
            title="Zoom In"
          >
            ➕
          </button>

          {/* Fullscreen Trigger */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-forest-900/30 rounded-lg text-slate-300 text-xs transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? "📴 Exit" : "📺 Fullscreen"}
          </button>

          {/* Download Menu */}
          <button
            onClick={() => downloadImage(afterUrl, "after_rgb.png")}
            className="bg-forest-600 hover:bg-forest-500 text-white font-semibold text-[10px] px-3 py-2 rounded-lg transition uppercase tracking-wider"
          >
            Download
          </button>
        </div>
      </div>

      {/* Comparison Area */}
      <div className="relative flex-1 w-full rounded-2xl border border-forest-900/20 bg-slate-950 overflow-hidden min-h-[300px] flex items-center justify-center">
        {/* Container that implements scaling */}
        <div 
          className="relative w-full h-full flex items-center justify-center transition-transform duration-100"
          style={{ transform: `scale(${zoomScale})` }}
        >
          {/* Back Image (After - T2) */}
          <img
            src={afterUrl}
            alt="After satellite view"
            className="absolute max-w-full max-h-full object-contain pointer-events-none select-none"
          />

          {/* Front Image (Before - T1) with width based on slider */}
          <div
            className="absolute top-0 bottom-0 left-0 overflow-hidden flex items-center"
            style={{ width: `${sliderPosition}%` }}
          >
            <div className="absolute w-[100vw] h-[100vh] top-0 left-0 flex items-center justify-center">
              <img
                src={beforeUrl}
                alt="Before satellite view"
                className="max-w-full max-h-full object-contain pointer-events-none select-none"
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>

          {/* Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-forest-400 shadow-lg shadow-forest-400/50 pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-forest-600 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-extrabold shadow-md">
              ↔
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 px-2.5 py-1 rounded text-[10px] text-slate-400 font-bold border border-forest-900/20 select-none">
          T1: Before Image
        </div>
        <div className="absolute bottom-3 right-3 bg-slate-950/80 px-2.5 py-1 rounded text-[10px] text-slate-400 font-bold border border-forest-900/20 select-none">
          T2: After Image
        </div>

        {/* Input slider overlapping the view */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
        />
      </div>
    </div>
  );
}
