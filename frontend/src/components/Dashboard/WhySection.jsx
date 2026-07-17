import React from 'react';
import { SectionHeader } from './CommonUI';
import { ShieldCheck, Zap, Satellite, BarChart2, Globe, Users } from 'lucide-react';

export default function WhySection() {
  const reasons = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: "Early Forest Protection",
      desc: "Detect forest degradation before it becomes irreversible."
    },
    {
      icon: <Zap className="w-6 h-6 text-emerald-400" />,
      title: "Faster Decision Making",
      desc: "Generate AI-powered insights within minutes."
    },
    {
      icon: <Satellite className="w-6 h-6 text-emerald-400" />,
      title: "Satellite-Driven Monitoring",
      desc: "Continuously monitor remote forest regions using satellite imagery."
    },
    {
      icon: <BarChart2 className="w-6 h-6 text-emerald-400" />,
      title: "Data-Driven Conservation",
      desc: "Support evidence-based planning and resource allocation."
    },
    {
      icon: <Globe className="w-6 h-6 text-emerald-400" />,
      title: "Sustainable Forest Management",
      desc: "Promote long-term biodiversity conservation and ecosystem protection."
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-400" />,
      title: "Decision Support for Authorities",
      desc: "Empower officers with intelligent analytics, reports, and actionable insights."
    }
  ];

  return (
    <div className="pt-24">
      <SectionHeader 
        title="Why AranyaSentinel AI?" 
        description="Built to accelerate environmental conservation through state-of-the-art technological intervention."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reasons.map((reason, idx) => (
          <div key={idx} className="flex space-x-4 p-4 rounded-xl hover:bg-slate-900/40 transition-colors">
            <div className="flex-shrink-0 w-12 h-12 bg-emerald-900/20 border border-emerald-500/20 rounded-full flex items-center justify-center">
              {reason.icon}
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-2">{reason.title}</h4>
              <p className="text-slate-400 text-sm leading-relaxed">{reason.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
