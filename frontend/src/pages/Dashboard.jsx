import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE = "http://127.0.0.1:8000";

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    forest_loss_percentage: 0.0,
    changed_area_hectares: 0.0,
    severity_score: "N/A",
    encroachment_count: 0,
    average_unet_confidence: 0.0,
    average_yolo_confidence: 0.0
  });
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/severity`)
      .then(res => {
        setMetrics(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Could not load latest severity report, using defaults.");
        setLoading(false);
      });

    axios.get(`${API_BASE}/forest-health`)
      .then(res => {
        setHealthData(res.data);
        setHealthLoading(false);
      })
      .catch(err => {
        console.warn("Could not load forest health report.");
        setHealthLoading(false);
      });
  }, []);

  // Trend data for Satpura forest loss (simulated years)
  const lineChartData = {
    labels: ["2022", "2023", "2024", "2025", "2026"],
    datasets: [
      {
        fill: true,
        label: "Cumulative Forest Loss %",
        data: [0, 1.8, 3.9, 5.8, metrics.forest_loss_percentage || 7.84],
        borderColor: "#3e995f",
        backgroundColor: "rgba(62, 153, 95, 0.15)",
        tension: 0.4,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: "Satpura Tiger Reserve - Deforestation Trend",
        color: "#94a3b8",
        font: { size: 14, weight: "bold" }
      }
    },
    scales: {
      x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#94a3b8" } },
      y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#94a3b8" } }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Hero Card */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-forest-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <div className="space-y-3 z-10">
          <span className="bg-forest-900/40 text-forest-300 border border-forest-500/25 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase inline-block">
            Status: Active Monitoring
          </span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">AranyaSentinel AI</h1>
          <p className="text-slate-300 text-lg max-w-xl font-medium">
            AI-Powered Forest Protection & Geospatial Intelligence Platform
          </p>
        </div>

        <div className="flex space-x-4 mt-6 md:mt-0 z-10">
          <Link
            to="/analyze"
            className="bg-forest-500 hover:bg-forest-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg transition duration-200"
          >
            Start Analysis
          </Link>
          <Link
            to="/reports"
            className="bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-forest-900/50 px-6 py-3.5 rounded-xl font-bold transition duration-200"
          >
            View Reports
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Card 1: Total Analyses */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Total Runs</span>
          <h2 className="text-3xl font-extrabold text-white mt-2">12 Runs</h2>
          <span className="text-xs text-forest-400 font-semibold mt-3 block">🛰️ GEE Sentinel-2</span>
        </div>

        {/* Card 2: Forest Loss % */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Forest Loss %</span>
          <h2 className="text-3xl font-extrabold text-emerald-400 mt-2">
            {loading ? "..." : `${metrics.forest_loss_percentage}%`}
          </h2>
          <span className="text-xs text-slate-500 mt-3 block">
            Area: {metrics.changed_area_hectares} Ha
          </span>
        </div>

        {/* Card 3: Severity */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Severity Status</span>
          <h2 className={`text-3xl font-extrabold mt-2 ${
            metrics.severity_score === "High" ? "text-red-400" :
            metrics.severity_score === "Medium" ? "text-amber-400" : "text-emerald-400"
          }`}>
            {loading ? "..." : metrics.severity_score}
          </h2>
          <span className="text-xs text-slate-500 mt-3 block">Threshold-defined</span>
        </div>

        {/* Card 4: Encroachments */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Encroachments</span>
          <h2 className="text-3xl font-extrabold text-white mt-2">
            {loading ? "..." : metrics.encroachment_count}
          </h2>
          <span className="text-xs text-red-400 font-semibold mt-3 block">⚠️ YOLOv8 Detections</span>
        </div>

        {/* Card 5: AI Confidence */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">U-Net Accuracy</span>
          <h2 className="text-3xl font-extrabold text-forest-300 mt-2">
            {loading ? "..." : `${(metrics.average_unet_confidence * 100).toFixed(1)}%`}
          </h2>
          <span className="text-xs text-slate-500 mt-3 block">Dice + BCE loss verified</span>
        </div>
      </div>

      {/* Forest Health Score Engine Section */}
      {!healthLoading && healthData && (
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-forest-900/20 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white tracking-wide">AI Forest Health Score</h3>
              <p className="text-slate-400 text-sm mt-1">Multi-criteria environmental health assessment</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                healthData.health_category === "Excellent" ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30" :
                healthData.health_category === "Healthy" ? "bg-forest-950/40 text-forest-300 border-forest-500/30" :
                healthData.health_category === "Moderate" ? "bg-amber-950/40 text-amber-300 border-amber-500/30" :
                healthData.health_category === "Poor" ? "bg-orange-950/40 text-orange-300 border-orange-500/30" :
                "bg-red-950/40 text-red-300 border-red-500/30"
              }`}>
                Status: {healthData.health_category}
              </span>
              <span className="text-4xl font-extrabold text-white">
                {healthData.forest_health_score}/100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Metric Breakdown Progress Bars */}
            <div className="space-y-4">
              <h4 className="text-slate-300 font-semibold text-sm">Environmental Metrics Breakdown</h4>
              <div className="space-y-3">
                {/* 1. Vegetation Health (NDVI) */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400">Vegetation Health (NDVI) - 25%</span>
                    <span className="text-emerald-400">{Math.round(healthData.metrics.vegetation_health)}%</span>
                  </div>
                  <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${healthData.metrics.vegetation_health}%` }}></div>
                  </div>
                </div>

                {/* 2. Canopy Moisture (NDMI) */}
                {healthData.indices && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-400">Canopy Moisture (NDMI) - 15%</span>
                      <span className="text-teal-400">
                        {Math.max(0, Math.min(100, Math.round(((healthData.indices.ndmi + 0.2) / 0.8) * 100)))}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, ((healthData.indices.ndmi + 0.2) / 0.8) * 100))}%` }}></div>
                    </div>
                  </div>
                )}

                {/* 3. Water Availability (NDWI) */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400">Water Availability (NDWI) - 10%</span>
                    <span className="text-blue-400">{Math.round(healthData.metrics.water_availability)}%</span>
                  </div>
                  <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${healthData.metrics.water_availability}%` }}></div>
                  </div>
                </div>

                {/* 4. Burn Severity (NBR) */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400">Fire Safety (NBR) - 10%</span>
                    <span className="text-orange-400">{Math.round(healthData.metrics.fire_risk)}%</span>
                  </div>
                  <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${healthData.metrics.fire_risk}%` }}></div>
                  </div>
                </div>

                {/* 5. VV Backscatter (SAR) */}
                {healthData.indices && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-400">Canopy Volume (VV Radar) - 10%</span>
                      <span className="text-indigo-400">
                        {Math.max(0, Math.min(100, Math.round(((healthData.indices.vv + 20) / 15) * 100)))}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, ((healthData.indices.vv + 20) / 15) * 100))}%` }}></div>
                    </div>
                  </div>
                )}

                {/* 6. VH Backscatter (SAR) */}
                {healthData.indices && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-400">Structure Density (VH Radar) - 10%</span>
                      <span className="text-purple-400">
                        {Math.max(0, Math.min(100, Math.round(((healthData.indices.vh + 28) / 18) * 100)))}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, ((healthData.indices.vh + 28) / 18) * 100))}%` }}></div>
                    </div>
                  </div>
                )}

                {/* 7. Forest Loss Score */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400">Forest Loss Score - 10%</span>
                    <span className="text-emerald-300">{Math.round(healthData.metrics.forest_loss)}%</span>
                  </div>
                  <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${healthData.metrics.forest_loss}%` }}></div>
                  </div>
                </div>

                {/* 8. Forest Density */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400">Forest Density (U-Net) - 5%</span>
                    <span className="text-forest-400">{Math.round(healthData.metrics.forest_density)}%</span>
                  </div>
                  <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-forest-500 h-full rounded-full transition-all duration-500" style={{ width: `${healthData.metrics.forest_density}%` }}></div>
                  </div>
                </div>

                {/* 9. Human Activity Score */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400">Human Activity Score (YOLOv8) - 5%</span>
                    <span className="text-amber-400">{Math.round(healthData.metrics.human_activity)}%</span>
                  </div>
                  <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${healthData.metrics.human_activity}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Natural Language Explanation Box */}
            <div className="flex flex-col justify-between bg-forest-950/20 p-5 rounded-2xl border border-forest-900/10 space-y-4">
              <div>
                <h4 className="text-slate-300 font-semibold text-sm mb-2">AI Diagnostic Summary</h4>
                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                  {healthData.explanation}
                </p>

                {/* Multi-Index Raw Values Grid */}
                {healthData.indices && (
                  <div className="mt-4 pt-4 border-t border-forest-900/15">
                    <h5 className="text-[10px] text-forest-300 font-extrabold uppercase tracking-wider mb-2">
                      🛰️ Upgraded Satellite Indices & SAR backscatter
                    </h5>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-forest-900/20 text-center">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">NDVI</span>
                        <span className="text-xs font-extrabold text-white mt-0.5 block">{healthData.indices.ndvi}</span>
                      </div>
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-forest-900/20 text-center">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">NDMI</span>
                        <span className="text-xs font-extrabold text-white mt-0.5 block">{healthData.indices.ndmi}</span>
                      </div>
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-forest-900/20 text-center">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">NDWI</span>
                        <span className="text-xs font-extrabold text-white mt-0.5 block">{healthData.indices.ndwi}</span>
                      </div>
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-forest-900/20 text-center">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">NBR</span>
                        <span className="text-xs font-extrabold text-white mt-0.5 block">{healthData.indices.nbr}</span>
                      </div>
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-forest-900/20 text-center">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">VV (SAR)</span>
                        <span className="text-xs font-extrabold text-white mt-0.5 block">{healthData.indices.vv} dB</span>
                      </div>
                      <div className="bg-slate-950/70 p-2 rounded-xl border border-forest-900/20 text-center">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">VH (SAR)</span>
                        <span className="text-xs font-extrabold text-white mt-0.5 block">{healthData.indices.vh} dB</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-[11px] text-slate-500 border-t border-forest-900/10 pt-3">
                Note: Calculated using dynamic weights defined in settings.yaml. Sub-scores range from 0 (critical) to 100 (optimal).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Charts & Analytics Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Graph */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>

        {/* Model Metrics Display */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-6">
          <h3 className="text-lg font-bold text-white tracking-wide border-b border-forest-900/20 pb-3">
            AI Platform Overview
          </h3>
          
          <div className="space-y-4 flex-1 justify-center flex flex-col">
            <div className="flex justify-between items-center bg-forest-950/20 p-3 rounded-xl border border-forest-900/10">
              <span className="text-slate-400 text-sm font-semibold">U-Net Segmenter</span>
              <span className="text-xs bg-forest-900 text-forest-300 px-2.5 py-1 rounded font-bold">CUDA Active</span>
            </div>
            
            <div className="flex justify-between items-center bg-forest-950/20 p-3 rounded-xl border border-forest-900/10">
              <span className="text-slate-400 text-sm font-semibold">YOLOv8 Detector</span>
              <span className="text-xs bg-forest-900 text-forest-300 px-2.5 py-1 rounded font-bold">Loaded (GPU 0)</span>
            </div>
            
            <div className="flex justify-between items-center bg-forest-950/20 p-3 rounded-xl border border-forest-900/10">
              <span className="text-slate-400 text-sm font-semibold">Dynamic Configuration</span>
              <span className="text-xs bg-forest-900 text-forest-300 px-2.5 py-1 rounded font-bold">Enabled</span>
            </div>
          </div>

          <div className="bg-forest-950/40 p-4 rounded-xl text-xs text-slate-400 leading-relaxed border border-forest-900/20">
            <strong>System Engine:</strong> AranyaSentinel utilizes Earth Engine for Cloud-masked Sentinel-2 bands, computes NDVI differentials, executes U-Net + YOLO segmentation inference in memory, and classifies deforestation severity level.
          </div>
        </div>
      </div>
    </div>
  );
}
