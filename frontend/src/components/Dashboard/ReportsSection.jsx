import React from "react";

export default function ReportsSection({ metrics, summaryText, downloadTextReport, downloadJsonReport, loading }) {
  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl animate-pulse space-y-4 h-[250px]">
        <div className="h-6 bg-forest-900/40 rounded w-1/4"></div>
        <div className="h-24 bg-forest-900/40 rounded w-full"></div>
      </div>
    );
  }

  const hasReport = !!metrics;

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      <div className="border-b border-forest-900/20 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Latest Analysis Reports</h3>
          <p className="text-[10px] text-slate-400">Download compiled outputs as standard text/json formats</p>
        </div>
        <span className="bg-forest-900 text-forest-300 font-mono text-[9px] px-2.5 py-1 rounded font-bold uppercase">
          Status: Ready
        </span>
      </div>

      {!hasReport ? (
        <div className="text-center py-6 text-xs text-slate-400">
          No reports found. Please run an analysis first on the Analysis page.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Metadata */}
          <div className="bg-forest-950/20 p-4 rounded-xl border border-forest-900/10 space-y-3">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Document Metadata</span>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Filename:</span>
                <span className="font-semibold text-white">summary.txt</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Format:</span>
                <span className="font-semibold text-white">Plain Text / JSON</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Language:</span>
                <span className="font-semibold text-white">English (EN)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Audit Status:</span>
                <span className="font-bold text-emerald-400">Verified</span>
              </div>
            </div>
          </div>

          {/* Text Preview */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-forest-900/10 h-32 overflow-hidden relative">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-2">Report Content Preview</span>
            <pre className="text-[10px] text-slate-400 font-mono select-none pointer-events-none">
              {summaryText || `Region of Interest: Satpura Tiger Reserve\nDeforested Area: ${metrics?.changed_area_hectares || 0} Ha\nForest Loss %: ${metrics?.forest_loss_percentage || 0}%\nEncroachments: ${metrics?.encroachment_count || 0}`}
            </pre>
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
          </div>

          {/* Action triggers */}
          <div className="flex flex-col justify-center space-y-3">
            <button
              onClick={downloadTextReport}
              className="w-full bg-forest-600 hover:bg-forest-500 text-white font-bold text-xs py-3 rounded-xl transition uppercase tracking-wider shadow"
            >
              Download summary.txt
            </button>
            <button
              onClick={downloadJsonReport}
              className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-forest-900/30 font-bold text-xs py-3 rounded-xl transition uppercase tracking-wider"
            >
              Download severity.json
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
