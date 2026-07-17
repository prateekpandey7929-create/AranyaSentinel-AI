import React from "react";

function MiniTrend({ label, current, prev, isInverseGood = false, isPercent = false }) {
  const diff = current - prev;
  const isPositive = diff > 0;
  
  // If higher is worse (like loss or human activity), inverse the color
  const isGood = isInverseGood ? !isPositive : isPositive;
  
  let color = "text-slate-400";
  if (diff !== 0) {
    color = isGood ? "text-emerald-400" : "text-rose-400";
  }

  const sign = isPositive ? "+" : "";
  const valDisplay = isPercent ? `${current.toFixed(1)}%` : current;
  const diffDisplay = isPercent ? `${sign}${diff.toFixed(1)}%` : `${sign}${diff}`;

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col space-y-2">
      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</span>
      <div className="flex items-end space-x-3">
        <h2 className="text-3xl font-extrabold text-white">{valDisplay}</h2>
        <span className={`text-xs font-bold mb-1 ${color}`}>
          {diffDisplay}
        </span>
      </div>
      <span className="text-[9px] text-slate-500 font-mono">vs previous ({isPercent ? `${prev.toFixed(1)}%` : prev})</span>
    </div>
  );
}

export default function TrendCards({ data, loading }) {
  if (loading || !data || data.length < 2) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="glass-panel p-5 rounded-2xl animate-pulse h-[110px]">
             <div className="h-3 bg-forest-900/40 rounded w-1/2 mb-3"></div>
             <div className="h-8 bg-forest-900/40 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const latest = data[0];
  const prev = data[1];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <MiniTrend 
        label="Forest Loss" 
        current={latest.forest_loss_percentage} 
        prev={prev.forest_loss_percentage} 
        isInverseGood={true} 
        isPercent={true} 
      />
      <MiniTrend 
        label="NDVI Average" 
        current={latest.ndvi} 
        prev={prev.ndvi} 
      />
      <MiniTrend 
        label="Health Score" 
        current={latest.forest_health_score} 
        prev={prev.forest_health_score} 
      />
      
      {/* Severity Card (String based) */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col space-y-2">
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Severity Status</span>
        <div className="flex items-end space-x-3">
          <h2 className={`text-3xl font-extrabold ${latest.severity === "High" ? "text-rose-400" : latest.severity === "Medium" ? "text-amber-400" : "text-emerald-400"}`}>
            {latest.severity}
          </h2>
        </div>
        <span className="text-[9px] text-slate-500 font-mono">
          was {prev.severity}
        </span>
      </div>

      <MiniTrend 
        label="Human Activity" 
        current={latest.human_activity_score} 
        prev={prev.human_activity_score} 
        isInverseGood={true} 
      />
    </div>
  );
}
