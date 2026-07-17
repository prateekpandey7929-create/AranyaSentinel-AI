import React from "react";
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

export default function Analytics({ metrics, loading }) {
  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl animate-pulse flex flex-col justify-center items-center h-[350px]">
        <div className="h-8 bg-forest-900/40 rounded w-1/4 mb-4"></div>
        <div className="w-full h-48 bg-forest-900/40 rounded-xl"></div>
      </div>
    );
  }

  const lossPct = metrics?.forest_loss_percentage || 7.84;

  const forestLossTrendData = {
    labels: ["2022", "2023", "2024", "2025", "2026"],
    datasets: [
      {
        fill: true,
        label: "Cumulative Forest Loss %",
        data: [0, 1.8, 3.9, 5.8, lossPct],
        borderColor: "#3e995f",
        backgroundColor: "rgba(62, 153, 95, 0.15)",
        tension: 0.4,
      }
    ]
  };

  const forestLossOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Satpura Region - Cumulative Canopy Loss (%)",
        color: "#94a3b8",
        font: { size: 12, weight: "bold" }
      }
    },
    scales: {
      x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } },
      y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } }
    }
  };

  const ndviTrendData = {
    labels: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"],
    datasets: [
      {
        label: "Before Run (NDVI)",
        data: [0.72, 0.68, 0.52, 0.45, 0.58, 0.65],
        borderColor: "#64b680",
        backgroundColor: "transparent",
        tension: 0.3
      },
      {
        label: "After Run (NDVI)",
        data: [0.65, 0.59, 0.41, 0.32, 0.44, 0.53],
        borderColor: "#e11d48",
        backgroundColor: "transparent",
        tension: 0.3
      }
    ]
  };

  const ndviOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#94a3b8", font: { size: 10 } } },
      title: {
        display: true,
        text: "NDVI Index Seasonal Comparison",
        color: "#94a3b8",
        font: { size: 12, weight: "bold" }
      }
    },
    scales: {
      x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } },
      y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Chart 1 */}
      <div className="glass-panel p-6 rounded-3xl h-[350px] flex flex-col">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Canopy Degradation Rate</h4>
        <div className="flex-1 min-h-0">
          <Line data={forestLossTrendData} options={forestLossOptions} />
        </div>
      </div>

      {/* Chart 2 */}
      <div className="glass-panel p-6 rounded-3xl h-[350px] flex flex-col">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vegetation Health Index (NDVI)</h4>
        <div className="flex-1 min-h-0">
          <Line data={ndviTrendData} options={ndviOptions} />
        </div>
      </div>
    </div>
  );
}
