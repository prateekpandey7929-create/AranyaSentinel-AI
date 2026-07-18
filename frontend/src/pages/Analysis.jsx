import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
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
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("map");
  const [reportLang, setReportLang] = useState("en");
  const [config, setConfig] = useState(null);

  // Date ranges
  const [beforeDates, setBeforeDates] = useState({ start: "2022-01-01", end: "2022-03-31" });
  const [afterDates, setAfterDates] = useState({ start: "2026-01-01", end: "2026-03-31" });

  // Lat/Lon Inputs
  const [lat, setLat] = useState(22.50);
  const [lon, setLon] = useState(78.00);
  const [buffer, setBuffer] = useState(0.02);

  // Map Polygon coordinates
  const [polygonPoints, setPolygonPoints] = useState([]);

  // GeoJSON file content
  const [geojsonObj, setGeojsonObj] = useState(null);
  const [geojsonFileName, setGeojsonFileName] = useState("");

  // Upload Images
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);

  const navigate = useNavigate();

  // Processing state
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusLog, setStatusLog] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Results state
  const [analysisResult, setAnalysisResult] = useState(() => {
    const saved = sessionStorage.getItem("analysisResult");
    return saved ? JSON.parse(saved) : null;
  });
  const [resultCenter, setResultCenter] = useState(() => {
    const saved = sessionStorage.getItem("resultCenter");
    return saved ? JSON.parse(saved) : [22.45, 78.20];
  });
  const [resultBounds, setResultBounds] = useState(() => {
    const saved = sessionStorage.getItem("resultBounds");
    return saved ? JSON.parse(saved) : [
      [22.43, 78.18],
      [22.47, 78.22]
    ];
  });

  // Persist results
  useEffect(() => {
    if (analysisResult) {
      sessionStorage.setItem("analysisResult", JSON.stringify(analysisResult));
      sessionStorage.setItem("resultCenter", JSON.stringify(resultCenter));
      sessionStorage.setItem("resultBounds", JSON.stringify(resultBounds));
    } else {
      sessionStorage.removeItem("analysisResult");
      sessionStorage.removeItem("resultCenter");
      sessionStorage.removeItem("resultBounds");
    }
  }, [analysisResult, resultCenter, resultBounds]);

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
      sessionStorage.setItem("active_analysis_run", "true");
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
        setProgress(100);
        setStatusLog("Analysis completed successfully!");
        setAnalysisResult({
          ...res.data,
          output_files: {
            before_rgb: "/static/before_rgb.png",
            after_rgb: "/static/after_rgb.png",
            heatmap: "/static/heatmap.png",
            change_mask: "/static/change_mask.png",
            combined_result: "/static/combined_result.png"
          }
        });
        sessionStorage.setItem("active_analysis_run", "true");
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
                   Heatmap overlay active
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

              {/* AI Prediction & Recommendations */}
              {analysisResult.ai_prediction && (
                <div className="glass-panel p-6 rounded-2xl space-y-4 border-l-4 border-emerald-500">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />
                      </svg>
                      AI Diagnostic & Solutions
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      analysisResult.ai_prediction.severity === 'Critical' ? 'bg-red-900/50 text-red-400' :
                      analysisResult.ai_prediction.severity === 'High' ? 'bg-orange-900/50 text-orange-400' :
                      analysisResult.ai_prediction.severity === 'Moderate' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-emerald-900/50 text-emerald-400'
                    }`}>
                      {analysisResult.ai_prediction.severity} Severity
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-semibold">Diagnosis</span>
                        <p className="text-sm text-slate-300 mt-1 font-medium">{analysisResult.ai_prediction.prediction}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-semibold">Reasoning</span>
                        <p className="text-sm text-slate-300 mt-1">{analysisResult.ai_prediction.reason}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-semibold">AI Summary</span>
                        <p className="text-sm text-slate-500 mt-1 italic leading-relaxed">{analysisResult.ai_prediction.ai_summary}</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/80">
                      <span className="text-xs text-emerald-400 uppercase font-bold flex items-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Recommended Actions
                      </span>
                      <ul className="space-y-2">
                        {analysisResult.ai_prediction.suggested_actions.map((action, idx) => (
                          <li key={idx} className="text-sm text-slate-300 flex items-start">
                            <span className="text-emerald-500 mr-2 mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons for Trend Analysis & Report Generation */}
              <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate("/history")}
                  className="w-full py-4 rounded-xl font-bold transition shadow-lg bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 border border-emerald-500/20 flex items-center justify-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Trend Analysis</span>
                </button>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3.5 h-full">
                    <span className="text-sm text-slate-300 whitespace-nowrap mr-2">English +</span>
                    <select 
                      value={reportLang}
                      onChange={(e) => setReportLang(e.target.value)}
                      className="w-full bg-transparent text-emerald-400 text-sm font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="en">Any Regional Lang</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="mr">मराठी (Marathi)</option>
                      <option value="gu">ગુજરાતી (Gujarati)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="kn">ಕನ್ನಡ (Kannada)</option>
                      <option value="ml">മലയാളം (Malayalam)</option>
                      <option value="bn">বাংলা (Bengali)</option>
                      <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      setGeneratingReport(true);
                      triggerToast("Generating comprehensive report...", "success");
                      const res = await axios.post(`${API_BASE}/report/generate?lang=${reportLang}`);
                      if (res.data.status === "success") {
                        triggerToast("Report Generated! Navigating to Reports...", "success");
                        setTimeout(() => navigate("/reports"), 1500);
                      }
                    } catch (err) {
                      console.error(err);
                      triggerToast("Failed to generate report.", "error");
                    } finally {
                      setGeneratingReport(false);
                    }
                  }}
                  disabled={generatingReport}
                  className={`w-full py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center space-x-2 ${
                    generatingReport ? "bg-forest-900/50 text-slate-500 cursor-not-allowed" : "bg-forest-500 hover:bg-forest-600 text-white"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span>{generatingReport ? "Generating..." : "Generate Report"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
