import React from 'react';
import { SectionHeader, AnimatedCounter, LoadingSkeleton } from './CommonUI';
import { Trees, FileBarChart, AlertTriangle, FileText, Map, Calendar, Cpu, Users } from 'lucide-react';

export default function StatisticsCards({ stats, loading }) {
  const statItems = [
    { label: "Forests Monitored", value: stats?.forests_monitored, icon: <Trees className="w-5 h-5" /> },
    { label: "Total Analyses", value: stats?.total_analyses, icon: <FileBarChart className="w-5 h-5" /> },
    { label: "High-Risk Forests", value: stats?.high_risk_forests, icon: <AlertTriangle className="w-5 h-5" /> },
    { label: "Reports Generated", value: stats?.reports_generated, icon: <FileText className="w-5 h-5" /> },
    { label: "Protected Areas Covered", value: stats?.protected_areas_covered, icon: <Map className="w-5 h-5" /> },
    { label: "Today's Analyses", value: stats?.todays_analyses, icon: <Calendar className="w-5 h-5" /> },
    { label: "AI Models Deployed", value: stats?.ai_models_deployed, icon: <Cpu className="w-5 h-5" /> },
    { label: "Active Forest Officers", value: stats?.active_forest_officers, icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="pt-24">
      <SectionHeader 
        title="Platform Impact at a Glance" 
        description="Live telemetry and intelligence processing metrics from the AranyaSentinel AI core engine."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statItems.map((item, idx) => (
          <div 
            key={idx} 
            className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition-colors group"
          >
            <div className="text-emerald-500/50 mb-3 group-hover:text-emerald-400 transition-colors">
              {item.icon}
            </div>
            
            <div className="text-3xl md:text-4xl font-extrabold text-white mb-2">
              {loading ? (
                <LoadingSkeleton className="h-10 w-16 mx-auto" />
              ) : (
                item.value !== undefined && item.value !== null ? (
                  <AnimatedCounter value={item.value} />
                ) : (
                  <span className="text-xl text-slate-500">No Data</span>
                )
              )}
            </div>
            
            <div className="text-slate-400 text-xs md:text-sm font-semibold uppercase tracking-wider">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
