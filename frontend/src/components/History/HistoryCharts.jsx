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
  Filler,
  Legend
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
  Filler,
  Legend
);

export default function HistoryCharts({ trends, loading }) {
  if (loading || !trends) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl h-[300px] animate-pulse"></div>
        <div className="glass-panel p-6 rounded-3xl h-[300px] animate-pulse"></div>
      </div>
    );
  }

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false }
    },
    scales: {
      x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } },
      y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#94a3b8", font: { size: 10 } } }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const labels = trends.forest_loss_trend.map(t => t.date);

  const lossData = {
    labels,
    datasets: [{
      label: "Forest Loss %",
      data: trends.forest_loss_trend.map(t => t.value),
      borderColor: "#f43f5e",
      backgroundColor: "rgba(244, 63, 94, 0.1)",
      borderWidth: 2,
      tension: 0.4,
      fill: true
    }]
  };

  const ndviData = {
    labels,
    datasets: [{
      label: "NDVI",
      data: trends.ndvi_trend.map(t => t.value),
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      borderWidth: 2,
      tension: 0.4
    }]
  };

  const healthData = {
    labels,
    datasets: [{
      label: "Health Score",
      data: trends.health_trend.map(t => t.value),
      borderColor: "#10b981",
      backgroundColor: "rgba(16, 185, 129, 0.2)",
      borderWidth: 2,
      tension: 0.4,
      fill: true
    }]
  };

  const severityData = {
    labels,
    datasets: [{
      label: "Severity (3=High)",
      data: trends.severity_trend.map(t => t.value),
      backgroundColor: trends.severity_trend.map(t => 
        t.value === 3 ? "rgba(244, 63, 94, 0.8)" : 
        t.value === 2 ? "rgba(245, 158, 11, 0.8)" : "rgba(16, 185, 129, 0.8)"
      ),
      borderRadius: 4
    }]
  };

  const activityData = {
    labels,
    datasets: [{
      label: "Human Activity Score",
      data: trends.human_activity_trend.map(t => t.value),
      borderColor: "#f59e0b",
      backgroundColor: "rgba(245, 158, 11, 0.1)",
      borderWidth: 2,
      tension: 0.4,
      borderDash: [5, 5]
    }]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Loss Trend */}
      <div className="glass-panel p-6 rounded-3xl h-[320px] flex flex-col">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Forest Loss Trend</h3>
        <div className="flex-1 relative w-full h-full">
          <Line data={lossData} options={commonOptions} />
        </div>
      </div>

      {/* Health Trend */}
      <div className="glass-panel p-6 rounded-3xl h-[320px] flex flex-col">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Forest Health Trend</h3>
        <div className="flex-1 relative w-full h-full">
          <Line data={healthData} options={commonOptions} />
        </div>
      </div>

      {/* NDVI Trend */}
      <div className="glass-panel p-6 rounded-3xl h-[320px] flex flex-col">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">NDVI Average Trend</h3>
        <div className="flex-1 relative w-full h-full">
          <Line data={ndviData} options={commonOptions} />
        </div>
      </div>

      {/* Severity & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl h-[320px] flex flex-col">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Severity</h3>
          <div className="flex-1 relative w-full h-full">
            <Bar data={severityData} options={{...commonOptions, scales: {...commonOptions.scales, y: { ...commonOptions.scales.y, max: 3.5, min: 0, ticks: { stepSize: 1 } }}}} />
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-3xl h-[320px] flex flex-col">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Human Activity</h3>
          <div className="flex-1 relative w-full h-full">
            <Line data={activityData} options={commonOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
