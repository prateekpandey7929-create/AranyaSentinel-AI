import React from 'react';
import { SectionHeader } from './CommonUI';
import { 
  Camera, 
  Map, 
  Cpu, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  Globe 
} from 'lucide-react';

export default function CapabilityCards() {
  const capabilities = [
    {
      title: "Satellite Image Analysis",
      desc: "Process high-resolution multi-spectral optical data from Sentinel-2.",
      icon: <Camera className="w-8 h-8 text-emerald-400" />
    },
    {
      title: "Forest Change Detection",
      desc: "Calculate precise NDVI variations to identify canopy degradation.",
      icon: <Map className="w-8 h-8 text-emerald-400" />
    },
    {
      title: "AI Segmentation & Detection",
      desc: "U-Net algorithms mask deforestation while YOLOv8 spots human structures.",
      icon: <Cpu className="w-8 h-8 text-emerald-400" />
    },
    {
      title: "Forest Health Assessment",
      desc: "Score ecological stability based on multi-dimensional AI metrics.",
      icon: <Activity className="w-8 h-8 text-emerald-400" />
    },
    {
      title: "Illegal Encroachment Detection",
      desc: "Identify unauthorized logging camps and pathways instantly.",
      icon: <AlertTriangle className="w-8 h-8 text-rose-400" />
    },
    {
      title: "Historical Trend Analysis",
      desc: "Track spatial and temporal variations across 12-month trailing datasets.",
      icon: <TrendingUp className="w-8 h-8 text-emerald-400" />
    },
    {
      title: "Automated Report Generation",
      desc: "Export comprehensive PDF summaries equipped with AI recommendations.",
      icon: <FileText className="w-8 h-8 text-emerald-400" />
    },
    {
      title: "Multilingual Support",
      desc: "Access platform tools and generate reports in 10+ regional languages.",
      icon: <Globe className="w-8 h-8 text-emerald-400" />
    }
  ];

  return (
    <div className="pt-24">
      <SectionHeader 
        title="Core Capabilities" 
        description="A complete suite of deep learning and geospatial tools engineered specifically for modern forest conservation."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {capabilities.map((cap, idx) => (
          <div 
            key={idx} 
            className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:bg-slate-800/80 hover:border-emerald-700/50 transition-all duration-300 group shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden"
          >
            {/* Hover Micro Interaction Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all duration-500 pointer-events-none"></div>
            
            <div className="w-14 h-14 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:border-emerald-500/30 transition-transform duration-300">
              {cap.icon}
            </div>
            
            <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-emerald-300 transition-colors">
              {cap.title}
            </h3>
            
            <p className="text-slate-400 text-sm leading-relaxed">
              {cap.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
