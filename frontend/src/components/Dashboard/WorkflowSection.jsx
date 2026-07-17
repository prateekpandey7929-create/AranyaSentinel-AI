import React from 'react';
import { SectionHeader, LoadingSkeleton } from './CommonUI';
import { ArrowRight, ArrowDown } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function WorkflowSection({ steps, loading }) {
  if (loading || !steps) {
    return (
      <div className="pt-24">
        <SectionHeader title="Project Workflow" />
        <div className="flex flex-col lg:flex-row justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {[1,2,3,4,5].map(i => <LoadingSkeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24">
      <SectionHeader 
        title="Project Workflow" 
        description="A streamlined, fully automated pipeline from raw satellite data to intelligent decision support."
      />

      {/* Desktop Horizontal Workflow */}
      <div className="hidden lg:flex items-center justify-between relative pt-8">
        {/* Connector Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-900 via-emerald-500 to-emerald-900 -z-10 rounded-full opacity-50"></div>
        
        {steps.map((step, idx) => {
          // Dynamically grab icon from Lucide
          const IconComponent = Icons[step.icon.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')] || Icons.Box;
          
          return (
            <div key={idx} className="flex flex-col items-center flex-1 relative group px-2">
              <div className="w-16 h-16 bg-slate-900 border-2 border-emerald-500/50 rounded-full flex items-center justify-center mb-4 z-10 shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-110 group-hover:border-emerald-400 transition-all duration-300">
                <IconComponent className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-center bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg w-full min-h-[120px] group-hover:border-emerald-700/50 transition-colors">
                <h4 className="text-sm font-bold text-white mb-2">{step.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile/Tablet Vertical Workflow */}
      <div className="flex lg:hidden flex-col space-y-6 pt-4 relative">
        {/* Vertical Connector Line */}
        <div className="absolute top-0 bottom-0 left-8 w-1 bg-gradient-to-b from-emerald-900 via-emerald-500 to-emerald-900 -z-10 rounded-full opacity-50"></div>
        
        {steps.map((step, idx) => {
          const IconComponent = Icons[step.icon.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')] || Icons.Box;
          return (
            <div key={idx} className="flex items-center space-x-6 relative group">
              <div className="w-16 h-16 bg-slate-900 border-2 border-emerald-500/50 rounded-full flex items-center justify-center z-10 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex-shrink-0 group-hover:scale-110 transition-all">
                <IconComponent className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-lg flex-1 group-hover:border-emerald-700/50 transition-colors">
                <h4 className="text-base font-bold text-white mb-2">{step.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
