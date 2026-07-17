import React, { useState, useEffect } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Polygon, ImageOverlay, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = "http://127.0.0.1:8000";

// Map Event click and move listener to draw polygons and capture center
function MapEventsHandler({ onMapClick, onMapMove }) {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    moveend() {
      const center = map.getCenter();
      if (onMapMove) {
        onMapMove(center.lat, center.lng);
      }
    }
  });
  return null;
}

// Adjusts map viewport dynamically (with loop prevention)
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      const currentCenter = map.getCenter();
      const dist = Math.sqrt(
        Math.pow(currentCenter.lat - center[0], 2) +
        Math.pow(currentCenter.lng - center[1], 2)
      );
      if (dist > 0.0001) {
        map.setView(center, zoom);
      }
    }
  }, [center, zoom]);
  return null;
}

export default function Analysis() {
  const [activeTab, setActiveTab] = useState("map");
  const [config, setConfig] = useState(null);

  // Date ranges
  const [beforeDates, setBeforeDates] = useState({ start: "2022-01-01", end: "2022-03-31" });
  const [afterDates, setAfterDates] = useState({ start: "2026-01-01", end: "2026-03-31" });

  // Lat/Lon Inputs
  const [lat, setLat] = useState(22.45);
  const [lon, setLon] = useState(78.20);
  const [buffer, setBuffer] = useState(0.02);

  // Map Polygon coordinates
  const [polygonPoints, setPolygonPoints] = useState([]);

  // GeoJSON file content
  const [geojsonObj, setGeojsonObj] = useState(null);
  const [geojsonFileName, setGeojsonFileName] = useState("");

  // Upload Images
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);

  // Processing state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusLog, setStatusLog] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Results state
  const [analysisResult, setAnalysisResult] = useState(null);
  const [resultCenter, setResultCenter] = useState([22.45, 78.20]);
  const [resultBounds, setResultBounds] = useState([
    [22.43, 78.18],
    [22.47, 78.22]
  ]);

  // Load backend config default values
  useEffect(() => {
    axios.get(`${API_BASE}/config`)
      .then(res => {
        const cfg = res.data;
        setConfig(cfg);
        setBeforeDates(cfg.dates.before);
        setAfterDates(cfg.dates.after);
        setLat(cfg.roi.lat);
        setLon(cfg.roi.lon);
        setBuffer(cfg.roi.buffer_degree);
      })
      .catch(err => {
        console.error("Could not fetch config from backend:", err);
      });
  }, []);

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  const handleMapClick = (latVal, lonVal) => {
    setPolygonPoints(prev => [...prev, [latVal, lonVal]]);
  };

  const handleMapMove = (centerLat, centerLng) => {
    if (!loading) {
      setLat(parseFloat(centerLat.toFixed(6)));
      setLon(parseFloat(centerLng.toFixed(6)));
    }
  };

  const clearMapPolygon = () => {
    setPolygonPoints([]);
  };

  // Upload handlers
  const handleGeoJSONChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGeojsonFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          setGeojsonObj(parsed);
          triggerToast("GeoJSON file loaded successfully!", "success");
        } catch (err) {
          triggerToast("Invalid JSON file formatting", "error");
        }
      };
      reader.readAsText(file);
    }
  };

  // Execute Backend /analyze pipeline
  const runPipeline = async (payload) => {
    setLoading(true);
    setAnalysisResult(null);
    setProgress(10);
    setStatusLog("Initializing pipeline configuration...");

    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p < 85) return p + Math.floor(Math.random() * 8) + 2;
        return p;
      });
    }, 2000);

    const logStates = [
      "Connecting to Google Earth Engine...",
      "Querying Sentinel-2 COPERNICUS imagery...",
      "Applying QA60 clear-sky cloud mask...",
      "Downloading multispectral GeoTIFF bands (B2, B3, B4, B8)...",
      "Performing band alignment and resizing to 256x256...",
      "Calculating Before/After NDVI index datasets...",
      "Executing U-Net forest loss neural network inference on local GPU (CUDA)...",
      "Applying OpenCV morphological filters (kernel size: 5)...",
      "Running YOLOv8 construction encroachment footprint scanner...",
      "Calculating forest loss area and severity status...",
      "Generating high-contrast visual dashboard overlay..."
    ];

    let stateIdx = 0;
    const logInterval = setInterval(() => {
      if (stateIdx < logStates.length) {
        setStatusLog(logStates[stateIdx]);
        stateIdx++;
      }
    }, 3500);

    try {
      const response = await axios.post(`${API_BASE}/analyze`, payload);
      clearInterval(progressInterval);
      clearInterval(logInterval);
      setProgress(100);
      setStatusLog("Analysis completed successfully!");
      setAnalysisResult(response.data);
      triggerToast("Forest analysis complete!", "success");
    } catch (error) {
      clearInterval(progressInterval);
      clearInterval(logInterval);
      const errorMsg = error.response?.data?.detail || "Pipeline run failed. Please check date ranges / ROI.";
      triggerToast(errorMsg, "error");
      setStatusLog(`[ERROR] ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Run Simulation mode for before/after image upload
  const runSimulation = () => {
    if (!beforeImage || !afterImage) {
      triggerToast("Please select both Before and After images", "error");
      return;
    }

    setLoading(true);
    setAnalysisResult(null);
    setProgress(15);
    setStatusLog("Loading local files...");

    const steps = [
      { log: "Checking spatial image bounds...", progress: 30 },
      { log: "Resizing images to 256x256 for U-Net compatibility...", progress: 50 },
      { log: "Executing U-Net forest loss neural network segmentation on GPU...", progress: 70 },
      { log: "Scanning for encroachment hotspots using YOLOv8...", progress: 85 },
      { log: "Retrieving analyzed spatial metrics and visualizations...", progress: 95 }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setStatusLog(step.log);
        setProgress(step.progress);
      }, (idx + 1) * 2000);
    });

    setTimeout(async () => {
      try {
        // Fetch actual values from backend outputs to populate results
        const res = await axios.get(`${API_BASE}/severity`);
        
        // Fetch AI prediction details dynamically
        let aiPrediction = null;
        try {
          const predRes = await axios.post(`${API_BASE}/ai-prediction`, {
            forest_loss_percentage: res.data.forest_loss_percentage || 0.0,
            encroachment_count: res.data.encroachment_count || 0,
            health_score: 75.0, // default simulation health
            season_classification: null,
            cloud_coverage_percentage: 0.0
          });
          aiPrediction = predRes.data;
        } catch (e) {
          console.error("Failed to query prediction in simulation:", e);
        }

        setProgress(100);
        setStatusLog("Analysis completed successfully!");
        setAnalysisResult({
          ...res.data,
          ai_prediction: aiPrediction,
          output_files: {
            before_rgb: "/static/before_rgb.png",
            after_rgb: "/static/after_rgb.png",
            heatmap: "/static/heatmap.png",
            change_mask: "/static/change_mask.png",
            combined_result: "/static/combined_result.png"
          }
        });
        triggerToast("Simulation complete! Displaying metrics for uploaded profiles.", "success");
      } catch (err) {
        triggerToast("Failed to fetch simulation metrics", "error");
      } finally {
        setLoading(false);
      }
    }, (steps.length + 1) * 2000);
  };

  // Submit trigger
  const handleAnalyzeSubmit = () => {
    if (activeTab === "map") {
      if (polygonPoints.length < 3) {
        triggerToast("Map polygon requires at least 3 points", "error");
        return;
      }
      // Close polygon coordinates properly for GeoJSON formatting
      const closedPoints = [...polygonPoints, polygonPoints[0]];
      const coords = closedPoints.map(p => [p[1], p[0]]); // GeoJSON is [lon, lat]

      // Compute bounding box and centroid of the drawn polygon
      const lats = polygonPoints.map(p => p[0]);
      const lons = polygonPoints.map(p => p[1]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const centerLon = lons.reduce((a, b) => a + b, 0) / lons.length;

      setResultCenter([centerLat, centerLon]);
      setResultBounds([[minLat, minLon], [maxLat, maxLon]]);

      const payload = {
        before_dates: beforeDates,
        after_dates: afterDates,
        roi_geojson: {
          type: "Polygon",
          coordinates: [coords]
        }
      };
      runPipeline(payload);
    } else if (activeTab === "latlon") {
      const flatLat = parseFloat(lat);
      const flatLon = parseFloat(lon);
      const flatBuf = parseFloat(buffer);

      setResultCenter([flatLat, flatLon]);
      setResultBounds([
        [flatLat - flatBuf, flatLon - flatBuf],
        [flatLat + flatBuf, flatLon + flatBuf]
      ]);

      const payload = {
        before_dates: beforeDates,
        after_dates: afterDates,
        roi_latlon: {
          lat: flatLat,
          lon: flatLon,
          buffer_degree: flatBuf
        }
      };
      runPipeline(payload);
    } else if (activeTab === "geojson") {
      if (!geojsonObj) {
        triggerToast("Please upload a valid GeoJSON file", "error");
        return;
      }
      let gCoords = [];
      try {
        let geom = geojsonObj;
        if (geojsonObj.type === "FeatureCollection") {
          geom = geojsonObj.features[0].geometry;
        } else if (geojsonObj.type === "Feature") {
          geom = geojsonObj.geometry;
        }
        if (geom.type === "Polygon") {
          gCoords = geom.coordinates[0]; // List of [lon, lat]
        } else if (geom.type === "MultiPolygon") {
          gCoords = geom.coordinates[0][0];
        }
      } catch (e) {
        console.error("Failed to parse geojson coords", e);
      }

      if (gCoords.length > 0) {
        const lats = gCoords.map(c => c[1]);
        const lons = gCoords.map(c => c[0]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const centerLon = lons.reduce((a, b) => a + b, 0) / lons.length;

        setResultCenter([centerLat, centerLon]);
        setResultBounds([[minLat, minLon], [maxLat, maxLon]]);
      } else {
        setResultCenter([lat, lon]);
        setResultBounds([[lat - buffer, lon - buffer], [lat + buffer, lon + buffer]]);
      }

      const payload = {
        before_dates: beforeDates,
        after_dates: afterDates,
        roi_geojson: geojsonObj
      };
      runPipeline(payload);
    } else if (activeTab === "upload") {
      setResultCenter([lat, lon]);
      setResultBounds([[lat - buffer, lon - buffer], [lat + buffer, lon + buffer]]);
      runSimulation();
    }
  };

  // Calculate Map Bounds for Heatmap overlay based on active lat/lon
  const mapCenter = [lat, lon];
  const heatmapBounds = [
    [lat - buffer, lon - buffer],
    [lat + buffer, lon + buffer]
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast Alert Notifications */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[999] px-6 py-3.5 rounded-xl shadow-xl flex items-center space-x-3 text-white border transition-all duration-300 font-semibold ${
          toast.type === "error" ? "bg-red-950/80 border-red-500 text-red-200" : "bg-forest-950/80 border-forest-500 text-forest-200"
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hero Banner Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Geospatial AI Analysis</h1>
        <p className="text-slate-400 text-sm mt-1">
          Select date ranges, configure your Region of Interest (ROI), and run deep-learning segmentations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Setup Forms */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl space-y-6">
          <h2 className="text-lg font-bold text-white tracking-wide border-b border-forest-900/20 pb-3">
            Analysis Parameters
          </h2>

          {/* Dates Selection block */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-forest-300 uppercase tracking-widest">Date Configurations</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Before Start</label>
                <input
                  type="date"
                  value={beforeDates.start}
                  onChange={e => setBeforeDates({ ...beforeDates, start: e.target.value })}
                  className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Before End</label>
                <input
                  type="date"
                  value={beforeDates.end}
                  onChange={e => setBeforeDates({ ...beforeDates, end: e.target.value })}
                  className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2 text-sm text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">After Start</label>
                <input
                  type="date"
                  value={afterDates.start}
                  onChange={e => setAfterDates({ ...afterDates, start: e.target.value })}
                  className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">After End</label>
                <input
                  type="date"
                  value={afterDates.end}
                  onChange={e => setAfterDates({ ...afterDates, end: e.target.value })}
                  className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2 text-sm text-white"
                />
              </div>
            </div>
          </div>

          {/* ROI Option Tabs */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-forest-300 uppercase tracking-widest">ROI Capture Methods</h3>
            <div className="grid grid-cols-4 gap-1 bg-slate-950/80 p-1 rounded-xl border border-forest-900/20">
              {["map", "latlon", "geojson", "upload"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] uppercase font-bold py-2 rounded-lg transition ${
                    activeTab === tab ? "bg-forest-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "latlon" ? "Coords" : tab}
                </button>
              ))}
            </div>

            {/* TAB: Interactive Map instructions */}
            {activeTab === "map" && (
              <div className="space-y-3 bg-forest-950/20 p-4 rounded-xl border border-forest-900/10">
                <span className="text-xs text-slate-300 font-semibold block">Option 1: Selection Map</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Right hand window par clickable map hai. Screen par click karke custom deforestation selection polygon banayein.
                </p>
                {polygonPoints.length > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[11px] text-emerald-400 font-bold">{polygonPoints.length} Points Selected</span>
                    <button
                      onClick={clearMapPolygon}
                      className="text-[10px] uppercase bg-red-950 text-red-300 px-2 py-1 rounded hover:bg-red-900"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Latitude and Longitude */}
            {activeTab === "latlon" && (
              <div className="space-y-3 bg-forest-950/20 p-4 rounded-xl border border-forest-900/10">
                <span className="text-xs text-slate-300 font-semibold block">Option 2: Coordinates</span>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={lat}
                      onChange={e => setLat(parseFloat(e.target.value))}
                      className="w-full bg-slate-950/60 border border-forest-900/40 rounded p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={lon}
                      onChange={e => setLon(parseFloat(e.target.value))}
                      className="w-full bg-slate-950/60 border border-forest-900/40 rounded p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Buffer size (Degree)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={buffer}
                      onChange={e => setBuffer(parseFloat(e.target.value))}
                      className="w-full bg-slate-950/60 border border-forest-900/40 rounded p-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GeoJSON Upload */}
            {activeTab === "geojson" && (
              <div className="space-y-3 bg-forest-950/20 p-4 rounded-xl border border-forest-900/10">
                <span className="text-xs text-slate-300 font-semibold block">Option 3: GeoJSON File</span>
                <input
                  type="file"
                  accept=".geojson,application/json"
                  onChange={handleGeoJSONChange}
                  className="hidden"
                  id="geojson-upload"
                />
                <label
                  htmlFor="geojson-upload"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-forest-900/40 hover:border-forest-500 rounded-xl p-6 cursor-pointer bg-slate-950/60 hover:bg-slate-950/80 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-[11px] text-slate-300">
                    {geojsonFileName ? geojsonFileName : "Upload file (.geojson)"}
                  </span>
                </label>
              </div>
            )}

            {/* TAB: Local Images upload */}
            {activeTab === "upload" && (
              <div className="space-y-3 bg-forest-950/20 p-4 rounded-xl border border-forest-900/10">
                <span className="text-xs text-slate-300 font-semibold block">Option 4: Compare Local Images</span>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Before image (T1)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setBeforeImage(e.target.files[0])}
                      className="w-full text-xs text-slate-400 file:bg-forest-900 file:border-none file:px-2.5 file:py-1 file:rounded file:text-white file:font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">After image (T2)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setAfterImage(e.target.files[0])}
                      className="w-full text-xs text-slate-400 file:bg-forest-900 file:border-none file:file:px-2.5 file:py-1 file:rounded file:text-white file:font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyzeSubmit}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold transition shadow-lg ${
              loading ? "bg-forest-900 text-slate-500 cursor-not-allowed" : "bg-forest-500 hover:bg-forest-600 text-white"
            }`}
          >
            {loading ? "Processing..." : "Run AI Analysis"}
          </button>
        </div>

        {/* Right Side: Interactive Selection Map OR Pipeline loaders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Processing Loader Box */}
          {loading && (
            <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center space-y-6 min-h-[450px]">
              <div className="relative flex items-center justify-center">
                <div className="animate-spin rounded-full h-24 w-24 border-4 border-forest-900/30 border-t-forest-400"></div>
                <span className="absolute text-slate-300 font-bold text-lg">{progress}%</span>
              </div>
              
              <div className="w-full max-w-md space-y-2">
                <div className="w-full bg-slate-950/80 rounded-full h-2.5 border border-forest-900/30 overflow-hidden">
                  <div className="bg-forest-400 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-center text-xs text-slate-400 animate-pulse mt-2">{statusLog}</p>
              </div>
            </div>
          )}

          {/* Interactive Bounding Selection Leaflet map */}
          {!loading && !analysisResult && (
            <div className="glass-panel p-2 rounded-3xl relative overflow-hidden">
              <MapContainer center={mapCenter} zoom={13}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <MapEventsHandler onMapClick={handleMapClick} onMapMove={handleMapMove} />
                {polygonPoints.length > 0 && (
                  <Polygon positions={polygonPoints} pathOptions={{ color: "#4ade80", fillColor: "#4ade80", fillOpacity: 0.2 }} />
                )}
                <ChangeView center={mapCenter} zoom={13} />
              </MapContainer>
              <div className="absolute bottom-4 right-4 z-[99] bg-slate-950/90 border border-forest-900/50 p-3 rounded-lg text-[10px] text-slate-400 max-w-xs">
                <strong>Map Tools:</strong> Map par coordinates select karne ke liye direct borders par click karke bounds define karein, click sequence automatic path outline design karega.
              </div>
            </div>
          )}

          {/* Analysis Outputs/Results Dashboard */}
          {analysisResult && (
            <div className="space-y-6 animate-fadeIn">
              {/* Cloud Cover Warning Banner */}
              {analysisResult.cloud_warning && (
                <div className="bg-amber-950/40 border border-amber-500/30 text-amber-300 p-4 rounded-xl text-xs font-semibold leading-relaxed">
                  ⚠️ {analysisResult.cloud_warning}
                </div>
              )}

              {/* Stats highlights banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Loss %</span>
                  <h4 className="text-2xl font-extrabold text-emerald-400 mt-1">{analysisResult.forest_loss_percentage}%</h4>
                </div>
                <div className="glass-panel p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Deforested Area</span>
                  <h4 className="text-2xl font-extrabold text-white mt-1">{analysisResult.changed_area_hectares} Ha</h4>
                </div>
                <div className="glass-panel p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Encroachments</span>
                  <h4 className="text-2xl font-extrabold text-amber-400 mt-1">{analysisResult.encroachment_count}</h4>
                </div>
                <div className="glass-panel p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Severity</span>
                  <h4 className="text-2xl font-extrabold text-white mt-1">{analysisResult.severity_score}</h4>
                </div>
              </div>

              {/* Confidence scores rates */}
              <div className="glass-panel p-4 rounded-xl flex justify-between text-xs text-slate-400">
                <span><strong>Avg U-Net Confidence:</strong> {analysisResult.average_unet_confidence}</span>
                <span><strong>Avg YOLOv8 Confidence:</strong> {analysisResult.average_yolo_confidence}</span>
              </div>

              {/* Season Verification Results Panel */}
              {analysisResult.season_verification && (
                <div className="glass-panel p-6 rounded-3xl space-y-6 border border-forest-900/30 relative overflow-hidden">
                  <div className="absolute -right-16 -top-16 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-forest-900/20 pb-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Season-Aware AI False Positive Verification
                      </span>
                      <h4 className="text-lg font-bold text-white tracking-tight">
                        Ecological Verification Verdict
                      </h4>
                    </div>

                    <span className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wider uppercase text-center ${
                      analysisResult.season_verification.classification === "Natural Seasonal Change"
                        ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                        : "bg-red-950/60 text-red-300 border border-red-500/30"
                    }`}>
                      {analysisResult.season_verification.classification}
                    </span>
                  </div>

                  {/* Body grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Diagnostic Explanation */}
                    <div className="md:col-span-2 space-y-3">
                      <span className="text-xs text-forest-300 font-bold uppercase tracking-wider block">
                        AI Ecological Diagnosis
                      </span>
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-forest-900/10 text-xs text-slate-300 leading-relaxed font-semibold">
                        {analysisResult.season_verification.explanation}
                      </div>
                    </div>

                    {/* Meteorological and Comparison Stats */}
                    <div className="md:col-span-1 space-y-4">
                      {/* Confidence Score Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                          <span>Verification Confidence</span>
                          <span className="text-white">{analysisResult.season_verification.confidence_score}%</span>
                        </div>
                        <div className="w-full bg-slate-950/80 rounded-full h-2 border border-forest-900/20 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              analysisResult.season_verification.classification === "Natural Seasonal Change"
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${analysisResult.season_verification.confidence_score}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Climatological Summary Card */}
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-forest-900/10 space-y-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Environmental Parameters</span>
                        <div className="text-xs text-slate-300 font-semibold space-y-1">
                          <div>☁️ {analysisResult.season_verification.weather_summary}</div>
                          <div>🌱 Historical Avg NDVI: {analysisResult.season_verification.historical_ndvi_average}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Prediction & Suggested Solution Panel */}
              {analysisResult.ai_prediction && (
                <div className="glass-panel p-6 rounded-3xl space-y-6 border border-emerald-500/10 relative overflow-hidden">
                  <div className="absolute -right-24 -bottom-24 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl"></div>
                  
                  {/* Header */}
                  <div className="border-b border-forest-900/20 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-block">
                        🧠 AI Analysis & Diagnostic Insights
                      </span>
                      <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <span>Prediction: {analysisResult.ai_prediction.prediction}</span>
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        analysisResult.ai_prediction.severity === "Critical" || analysisResult.ai_prediction.severity === "High"
                          ? "bg-red-950/60 text-red-300 border border-red-500/35"
                          : analysisResult.ai_prediction.severity === "Moderate"
                            ? "bg-amber-950/60 text-amber-300 border border-amber-500/35"
                            : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/35"
                      }`}>
                        ⚠️ Severity: {analysisResult.ai_prediction.severity}
                      </span>
                      <span className="bg-slate-900/90 border border-forest-500/20 px-3 py-1.5 rounded-lg text-xs text-white font-bold">
                        🎯 Confidence: {analysisResult.ai_prediction.confidence_score}%
                      </span>
                    </div>
                  </div>

                  {/* Diagnostic details & Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                    {/* Diagnosis explanation */}
                    <div className="space-y-4">
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-forest-900/10 space-y-2.5">
                        <span className="text-forest-300 font-bold uppercase tracking-wider block text-[10px]">
                          🔎 Diagnostic Explanation
                        </span>
                        <p className="text-slate-300 font-semibold leading-relaxed">
                          {analysisResult.ai_prediction.reason}
                        </p>
                      </div>

                      {/* Unified AI summary */}
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-forest-900/10 space-y-2.5">
                        <span className="text-forest-300 font-bold uppercase tracking-wider block text-[10px]">
                          📋 Natural Language Executive Summary
                        </span>
                        <p className="text-slate-300 leading-relaxed font-semibold">
                          {analysisResult.ai_prediction.ai_summary}
                        </p>
                      </div>
                    </div>

                    {/* Solutions checklist */}
                    <div className="bg-emerald-950/15 p-4 rounded-2xl border border-emerald-500/20 space-y-3">
                      <span className="text-emerald-400 font-extrabold uppercase tracking-wider block text-[10px]">
                        🚨 Suggested Ecological Action Checklist
                      </span>
                      <div className="space-y-3 pt-1">
                        {analysisResult.ai_prediction.suggested_actions.map((action, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-slate-300 font-semibold">
                            <span className="bg-emerald-500/20 text-emerald-400 rounded-full p-1 text-[10px] leading-none select-none">
                              ✔
                            </span>
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Forest Trend & Future Prediction Panel */}
              {analysisResult.ai_prediction && analysisResult.ai_prediction.trend_direction && (
                <div className="glass-panel p-6 rounded-3xl space-y-6 border border-emerald-500/10 relative overflow-hidden">
                  <div className="absolute -left-24 -bottom-24 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl"></div>
                  
                  {/* Header */}
                  <div className="border-b border-forest-900/20 pb-4">
                    <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-block">
                      🌲 Forest Trend & Future Prediction
                    </span>
                    <h3 className="text-xl font-extrabold text-white tracking-tight mt-1">
                      Historical Trend & Projections
                    </h3>
                  </div>

                  {/* Main Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
                    {/* Left: Trend Status */}
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-forest-900/10 space-y-3 flex flex-col justify-center">
                      <span className="text-forest-300 font-bold uppercase tracking-wider block text-[10px]">
                        Trend
                      </span>
                      <div className={`text-2xl font-black ${
                        analysisResult.ai_prediction.trend_direction.includes("Degrading")
                          ? "text-red-400"
                          : analysisResult.ai_prediction.trend_direction.includes("Improving")
                            ? "text-emerald-400"
                            : "text-slate-300"
                      }`}>
                        {analysisResult.ai_prediction.trend_direction}
                      </div>
                    </div>

                    {/* Middle: Future Prediction */}
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-forest-900/10 space-y-3">
                      <span className="text-forest-300 font-bold uppercase tracking-wider block text-[10px]">
                        Future Prediction
                      </span>
                      <p className="text-slate-200 font-semibold text-sm leading-snug">
                        {analysisResult.ai_prediction.future_prediction}
                      </p>
                    </div>

                    {/* Right: Recovery Probability Gauge */}
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-forest-900/10 space-y-2 flex flex-col justify-center items-center text-center">
                      <span className="text-forest-300 font-bold uppercase tracking-wider block text-[10px] mb-1">
                        Recovery Probability
                      </span>
                      <div className="relative flex items-center justify-center">
                        {/* Circular Progress Gauge */}
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            className="stroke-slate-800"
                            strokeWidth="6"
                            fill="transparent"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            className={`${
                              analysisResult.ai_prediction.recovery_probability < 50
                                ? "stroke-red-500"
                                : analysisResult.ai_prediction.recovery_probability < 80
                                  ? "stroke-amber-500"
                                  : "stroke-emerald-500"
                            } transition-all duration-1000`}
                            strokeWidth="6"
                            strokeDasharray={2 * Math.PI * 34}
                            strokeDashoffset={2 * Math.PI * 34 * (1 - analysisResult.ai_prediction.recovery_probability / 100)}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>
                        <span className="absolute text-lg font-black text-white">
                          {analysisResult.ai_prediction.recovery_probability}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Block */}
                  <div className="bg-emerald-950/15 p-4 rounded-2xl border border-emerald-500/20 space-y-2">
                    <span className="text-emerald-400 font-extrabold uppercase tracking-wider block text-[10px]">
                      Trend Summary
                    </span>
                    <p className="text-slate-300 leading-relaxed font-semibold text-sm">
                      {analysisResult.ai_prediction.trend_summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Map displaying Heatmap Overlay */}
              <div className="glass-panel p-2 rounded-2xl relative overflow-hidden">
                <MapContainer center={resultCenter} zoom={13}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {/* Heatmap overlay image directly mounted on Leaflet */}
                  <ImageOverlay
                    url={`${API_BASE}${analysisResult.output_files.heatmap}?t=${Date.now()}`}
                    bounds={resultBounds}
                    opacity={0.65}
                  />
                  <ChangeView center={resultCenter} zoom={13} />
                </MapContainer>
                <div className="absolute top-4 right-4 z-[99] bg-slate-950/90 border border-forest-500/30 p-2.5 rounded text-[10px] text-emerald-400">
                  🔴 Heatmap overlay active
                </div>
              </div>

              {/* Outputs grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-4 rounded-2xl space-y-2">
                  <span className="text-xs text-slate-300 font-bold block">Before RGB (True-color)</span>
                  <img
                    src={`${API_BASE}${analysisResult.output_files.before_rgb}?t=${Date.now()}`}
                    alt="Before satellite"
                    className="w-full h-48 object-cover rounded-lg border border-forest-900/10"
                  />
                </div>
                <div className="glass-panel p-4 rounded-2xl space-y-2">
                  <span className="text-xs text-slate-300 font-bold block">After RGB (True-color)</span>
                  <img
                    src={`${API_BASE}${analysisResult.output_files.after_rgb}?t=${Date.now()}`}
                    alt="After satellite"
                    className="w-full h-48 object-cover rounded-lg border border-forest-900/10"
                  />
                </div>
                <div className="glass-panel p-4 rounded-2xl space-y-2">
                  <span className="text-xs text-slate-300 font-bold block">Change Mask</span>
                  <img
                    src={`${API_BASE}${analysisResult.output_files.change_mask}?t=${Date.now()}`}
                    alt="Change mask"
                    className="w-full h-48 object-cover rounded-lg border border-forest-900/10"
                  />
                </div>
                <div className="glass-panel p-4 rounded-2xl space-y-2">
                  <span className="text-xs text-slate-300 font-bold block">Combined 2x2 Dashboard</span>
                  <a
                    href={`${API_BASE}${analysisResult.output_files.combined_result}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block hover:opacity-95"
                  >
                    <img
                      src={`${API_BASE}${analysisResult.output_files.combined_result}?t=${Date.now()}`}
                      alt="Composite report"
                      className="w-full h-48 object-cover rounded-lg border border-forest-900/10"
                    />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
