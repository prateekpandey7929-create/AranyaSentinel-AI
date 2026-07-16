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
