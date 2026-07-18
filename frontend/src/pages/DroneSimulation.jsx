import React, { useState } from "react";
import axios from "axios";

export default function DroneSimulation() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // We provide a couple of sample presets for convenience
  const samplePresets = [
    {
      name: "Encroachment Scan (Truck/Car)",
      url: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=600&q=80",
      description: "Aerial forest road view with vehicles"
    },
    {
      name: "Dense Canopy Scan (Clear)",
      url: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80",
      description: "Pristine forest canopy vegetation"
    }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const selectPreset = async (presetUrl) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setPreviewUrl(presetUrl);
    setSelectedFile(null);

    try {
      // Fetch the preset image as a blob
      const response = await fetch(presetUrl);
      const blob = await response.blob();
      const file = new File([blob], "preset_image.jpg", { type: "image/jpeg" });
      setSelectedFile(file);
      await triggerUpload(file);
    } catch (err) {
      setError("Failed to load preset image. Try manual file upload.");
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (!selectedFile) {
      setError("Please upload an image file or select a preset first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    await triggerUpload(selectedFile);
  };

  const triggerUpload = async (fileToUpload) => {
    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      // Port 8001 is where the drone edge simulation microservice runs
      const res = await axios.post("http://127.0.0.1:8001/api/v1/edge/simulate-drone", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the Drone Simulation microservice. Make sure the server on port 8001 is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title & Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Drone Simulation Center</h1>
        <p className="text-slate-400 text-sm mt-1">
          Edge AI simulation testbed for live drone surveillance feeds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Upload Controls */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Simulate Drone Surveillance
            </h2>
            <span className="text-xs text-forest-400 font-bold uppercase tracking-wider block mt-1">
              (Cloudy Weather Mode)
            </span>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Used as a fallback when satellite view is blocked by clouds. Upload an aerial image to run edge AI YOLOv8 scans.
            </p>
          </div>

          {/* Presets List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-forest-300 uppercase tracking-widest">Select Preset Scan</h3>
            <div className="space-y-2">
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => selectPreset(preset.url)}
                  className="w-full text-left bg-slate-950/60 hover:bg-slate-900 border border-forest-900/20 hover:border-forest-500/30 p-3 rounded-xl transition flex flex-col space-y-1"
                >
                  <span className="text-xs font-bold text-white">{preset.name}</span>
                  <span className="text-[10px] text-slate-400">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Input */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-forest-300 uppercase tracking-widest">Or Upload Custom Feed</h3>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-forest-900/40 hover:border-forest-500/50 rounded-2xl p-6 cursor-pointer hover:bg-forest-950/10 transition bg-slate-950/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-forest-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-xs text-slate-300 font-bold">Choose File</span>
              <span className="text-[10px] text-slate-500 mt-1">PNG, JPG or JPEG</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {selectedFile && (
              <div className="text-xs text-slate-300 font-semibold bg-forest-950/20 p-2 rounded-lg border border-forest-900/20 truncate">
                File: {selectedFile.name}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleSimulate}
            disabled={loading || !selectedFile}
            className={`w-full py-3.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 text-sm shadow-xl ${
              !selectedFile || loading
                ? "bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed"
                : "bg-forest-500 hover:bg-forest-600 text-white shadow-forest-900/30"
            }`}
          >
            <span>🛸 Trigger Stream Simulation</span>
          </button>
        </div>

        {/* Right Side: Preview & Telemetry Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Visualizer Window */}
          <div className="glass-panel p-6 rounded-3xl min-h-[400px] flex flex-col justify-between relative overflow-hidden">
            {/* GIS Border Overlays */}
            <div className="absolute top-2 left-2 text-[9px] text-slate-500 font-mono tracking-widest">LAT: 22.33400 N | LON: 80.61100 E</div>
            <div className="absolute top-2 right-2 text-[9px] text-slate-500 font-mono tracking-widest">CAM: ACTIVE | HD FEED</div>

            <div className="my-auto py-8">
              {previewUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-forest-900/30 max-h-[350px] flex justify-center bg-black/40">
                  <img
                    src={previewUrl}
                    alt="Drone View Preview"
                    className="object-contain max-h-[350px] w-full"
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest-500 border-t-transparent"></div>
                      <span className="text-xs text-slate-300 font-bold uppercase tracking-widest animate-pulse">Running Edge AI Inference...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-16">
                  <div className="bg-forest-950/30 p-4 rounded-full border border-forest-900/20 text-forest-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">Visualizer Ready</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Select a preset scan or upload a custom image on the left panel to simulate live feed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Status footer inside visualizer */}
            {previewUrl && !loading && !result && !error && (
              <div className="bg-slate-950/60 p-3 rounded-xl border border-forest-900/20 text-center text-xs text-slate-300 font-semibold uppercase tracking-wider animate-pulse">
                Click Trigger Stream Simulation button to parse telemetry
              </div>
            )}
          </div>

          {/* Results Details Display Area */}
          {error && (
            <div className="bg-red-950/80 border border-red-500 text-red-200 p-4 rounded-2xl text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {result.alert_triggered ? (
                /* Flashing red alert banner */
                <div className="bg-red-950/80 border-2 border-red-500 text-red-200 p-4 rounded-2xl flex items-center justify-between shadow-xl animate-pulse">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🚨</span>
                    <div>
                      <h4 className="text-sm font-extrabold tracking-wide uppercase text-white">
                        CRITICAL ENCROACHMENT ALERT DETECTED VIA DRONE FEED
                      </h4>
                      <p className="text-[10px] text-red-300 font-semibold mt-0.5">
                        Target vehicle/person coordinates flagged. Local dispatch notified.
                      </p>
                    </div>
                  </div>
                  <span className="bg-red-500 text-white text-[10px] uppercase font-black px-2.5 py-1 rounded-full">
                    Alert Active
                  </span>
                </div>
              ) : (
                /* Green secure banner */
                <div className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 p-4 rounded-2xl flex items-center space-x-3 shadow-lg">
                  <span className="text-2xl">✅</span>
                  <div>
                    <h4 className="text-sm font-extrabold tracking-wide uppercase text-white">
                      Zone Secure - Normal Seasonal Vegetation
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                      Edge classifier scanned canopy structure. No artificial encroachment targets located.
                    </p>
                  </div>
                </div>
              )}

              {/* Detected targets breakdown */}
              <div className="glass-panel p-5 rounded-3xl space-y-4">
                <h3 className="text-xs font-bold text-forest-300 uppercase tracking-widest">
                  YOLOv8 Edge Telemetry Analysis
                </h3>
                {result.detections && result.detections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.detections.map((det, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/70 p-3.5 rounded-xl border border-forest-900/20 flex justify-between items-center"
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="bg-forest-900/40 text-forest-300 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                            {det.object}
                          </span>
                          <span className="text-xs text-white font-semibold capitalize">{det.object}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-forest-300">
                            {(det.confidence * 100).toFixed(1)}%
                          </span>
                          <span className="text-[9px] text-slate-500 block">Confidence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-xs text-slate-500 py-4 font-semibold uppercase tracking-wider">
                    No detections registered above 0.5 confidence threshold.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
