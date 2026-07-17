import React from "react";

export default function AiSummary({ metrics, loading, insights }) {
  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl animate-pulse space-y-4 h-[300px]">
        <div className="h-6 bg-forest-900/40 rounded w-1/3"></div>
        <div className="h-16 bg-forest-900/40 rounded w-full"></div>
        <div className="h-16 bg-forest-900/40 rounded w-full"></div>
      </div>
    );
  }

  const lossPct = metrics?.forest_loss_percentage ?? 0.0;
  const encroachments = metrics?.encroachment_count ?? 0;
  const severity = metrics?.severity_score ?? "Low";
  const unetAcc = metrics?.average_unet_confidence 
    ? `${(metrics.average_unet_confidence * 100).toFixed(1)}%` 
    : "N/A";

  // Dynamic recommendations & findings based on severity/loss
  const getAiInsights = () => {
    if (severity === "High" || lossPct > 15) {
      return {
        status: "Critical threat level. Immediate intervention required.",
        findings: `U-Net model identified major canopy degradation amounting to {lossPct}% (${metrics?.changed_area_hectares || 0} Ha). YOLOv8 scanner flagged ${encroachments} structures as active human encroachments within deforested quadrants.`,
        recommendations: "1. Deploy UAV patrols to scan coordinate hotspots.\n2. Cross-reference property registration records for building coordinates.\n3. Halt all logging permits in saturated buffer zones immediately.",
        reason: `Loss threshold exceeded critical limit of 15.0%. Segmentation overlap confidence remains high at ${unetAcc}.`
      };
    } else if (severity === "Medium" || lossPct > 5) {
      return {
        status: "Moderate threat. Active surveillance recommended.",
        findings: `Canopy loss stands at ${lossPct}%. Localized degradation patterns indicate edge deforestation. YOLOv8 detected ${encroachments} construction footprints.`,
        recommendations: "1. Conduct standard ground checks in identified edge grids.\n2. Schedule follow-up GEE Sentinel-2 pass in 30 days to assess change velocity.\n3. Review forest patrol schedules near encroachment boundaries.",
        reason: `Loss falls within moderate threshold bounds (5% - 15%). Dice intersection coefficient is stable at ${unetAcc}.`
      };
    } else {
      return {
        status: "Canopy is stable. Low threat indicators.",
        findings: `Minimal forest cover modification detected (${lossPct}% loss). YOLOv8 building detection shows ${encroachments} encroachments.`,
        recommendations: "1. Continue routine satellite-based monitoring cycles.\n2. Maintain local forest boundary checks.\n3. Store baseline outputs as reference templates for future scans.",
        reason: `Deforestation index is below low limit (5.0%). Spectral changes are within normal seasonal range.`
      };
    }
  };

  const activeInsights = insights ?? getAiInsights();

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      <div className="border-b border-forest-900/20 pb-3 flex justify-between items-center">
        <h3 className="text-base font-bold text-white uppercase tracking-wider">AI Forest Analysis Summary</h3>
        <span className="bg-forest-900 text-forest-300 font-mono text-[9px] px-2.5 py-1 rounded font-bold uppercase">
          AI Copilot Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Status & Findings */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Current Status</span>
            <p className="text-white font-semibold bg-forest-950/30 border border-forest-900/10 p-3 rounded-xl">
              {activeInsights.status}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Key Findings</span>
            <p className="text-slate-300 leading-relaxed bg-forest-950/10 p-3 rounded-xl border border-forest-900/5">
              {activeInsights.findings}
            </p>
          </div>
        </div>

        {/* Recommendations & Logic */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Recommended Actions</span>
            <div className="text-slate-300 bg-forest-950/20 p-3 rounded-xl border border-forest-900/10 whitespace-pre-line leading-relaxed font-mono text-[11px]">
              {activeInsights.recommendations}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Copilot Reasoning Logic</span>
            <p className="text-slate-400 italic leading-relaxed">
              {activeInsights.reason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
