import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export default function Settings() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    axios.get(`${API_BASE}/config`)
      .then(res => {
        setConfig(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load settings:", err);
        setLoading(false);
      });
  }, []);

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    axios.post(`${API_BASE}/config`, config)
      .then(res => {
        triggerToast("Configuration updated successfully on the server!", "success");
      })
      .catch(err => {
        triggerToast("Failed to update config values", "error");
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleNestedChange = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleDoubleNestedChange = (section, subSection, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: {
          ...prev[section][subSection],
          [key]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center text-slate-400 animate-pulse max-w-4xl mx-auto">
        Loading settings metadata...
      </div>
    );
  }

  if (!config) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center text-slate-400 max-w-4xl mx-auto">
        Failed to fetch configuration. Ensure FastAPI is running on port 8000.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[999] px-6 py-3.5 rounded-xl shadow-xl flex items-center space-x-3 text-white border transition-all duration-300 font-semibold ${
          toast.type === "error" ? "bg-red-950/80 border-red-500 text-red-200" : "bg-forest-950/80 border-forest-500 text-forest-200"
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">System Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Adjust pipeline parameters dynamically without restarting the FastAPI server.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Region of Interest (ROI) */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-white border-b border-forest-900/20 pb-3 uppercase tracking-wider">
            Region of Interest (ROI)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Region Name</label>
              <input
                type="text"
                value={config.roi.name}
                onChange={e => handleNestedChange("roi", "name", e.target.value)}
                className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Latitude Center</label>
              <input
                type="number"
                step="0.0001"
                value={config.roi.lat}
                onChange={e => handleNestedChange("roi", "lat", parseFloat(e.target.value))}
                className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Longitude Center</label>
              <input
                type="number"
                step="0.0001"
                value={config.roi.lon}
                onChange={e => handleNestedChange("roi", "lon", parseFloat(e.target.value))}
                className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">ROI Bounding Degree Buffer</label>
              <input
                type="number"
                step="0.001"
                value={config.roi.buffer_degree}
                onChange={e => handleNestedChange("roi", "buffer_degree", parseFloat(e.target.value))}
                className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Default Date Ranges */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-white border-b border-forest-900/20 pb-3 uppercase tracking-wider">
            Default Analysis Dates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-forest-300 uppercase tracking-widest">Before Period (T1)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={config.dates.before.start}
                    onChange={e => handleDoubleNestedChange("dates", "before", "start", e.target.value)}
                    className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">End Date</label>
                  <input
                    type="date"
                    value={config.dates.before.end}
                    onChange={e => handleDoubleNestedChange("dates", "before", "end", e.target.value)}
                    className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2 text-sm text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-forest-300 uppercase tracking-widest">After Period (T2)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={config.dates.after.start}
                    onChange={e => handleDoubleNestedChange("dates", "after", "start", e.target.value)}
                    className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">End Date</label>
                  <input
                    type="date"
                    value={config.dates.after.end}
                    onChange={e => handleDoubleNestedChange("dates", "after", "end", e.target.value)}
                    className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2 text-sm text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Machine Learning & Processing Thresholds */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-white border-b border-forest-900/20 pb-3 uppercase tracking-wider">
            Analysis Thresholds
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">NDVI Loss Threshold</label>
              <input
                type="number"
                step="0.01"
                value={config.thresholds.ndvi_loss_threshold}
                onChange={e => handleNestedChange("thresholds", "ndvi_loss_threshold", parseFloat(e.target.value))}
                className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">U-Net Mask Probability Threshold</label>
              <input
                type="number"
                step="0.05"
                value={config.thresholds.unet_threshold}
                onChange={e => handleNestedChange("thresholds", "unet_threshold", parseFloat(e.target.value))}
                className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">YOLOv8 Confidence Threshold</label>
              <input
                type="number"
                step="0.05"
                value={config.thresholds.yolo_conf}
                onChange={e => handleNestedChange("thresholds", "yolo_conf", parseFloat(e.target.value))}
                className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Morphology Filter Kernel Size</label>
              <input
                type="number"
                step="2"
                min="1"
                max="15"
                value={config.thresholds.morphology_kernel_size}
                onChange={e => handleNestedChange("thresholds", "morphology_kernel_size", parseInt(e.target.value))}
                className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Low Severity Loss Limit (%)</label>
              <input
                type="number"
                step="0.5"
                value={config.thresholds.severity.low}
                onChange={e => handleDoubleNestedChange("thresholds", "severity", "low", parseFloat(e.target.value))}
                className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Medium Severity Loss Limit (%)</label>
              <input
                type="number"
                step="0.5"
                value={config.thresholds.severity.medium}
                onChange={e => handleDoubleNestedChange("thresholds", "severity", "medium", parseFloat(e.target.value))}
                className="w-full bg-slate-950/60 border border-forest-900/40 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`px-8 py-3.5 rounded-xl font-bold transition shadow-lg ${
              saving ? "bg-forest-900 text-slate-500 cursor-not-allowed" : "bg-forest-500 hover:bg-forest-600 text-white"
            }`}
          >
            {saving ? "Saving settings..." : "Save Settings Dynamic"}
          </button>
        </div>
      </form>
    </div>
  );
}
