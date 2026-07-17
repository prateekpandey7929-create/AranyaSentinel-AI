import React from 'react';
import { Shield, Target, Globe } from 'lucide-react';
import { SectionHeader } from './CommonUI';

export default function AboutSection() {
  return (
    <div className="pt-20">
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl hover:border-forest-700/50 transition-colors relative overflow-hidden">
        
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Globe className="w-64 h-64 text-emerald-500" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-forest-900/40 border border-forest-800 text-emerald-400 text-sm font-semibold mb-2">
              <Shield className="w-4 h-4" />
              <span>Mission Overview</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              About AranyaSentinel AI
            </h2>
            
            <p className="text-lg text-slate-300 leading-relaxed">
              AranyaSentinel AI is an AI-powered forest monitoring platform that leverages satellite imagery, geospatial intelligence, and deep learning models to detect forest changes, monitor environmental health, identify illegal activities, and generate intelligent reports for sustainable forest management and conservation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50 shadow-inner">
              <Target className="w-10 h-10 text-emerald-500 mb-4" />
              <h4 className="text-lg font-bold text-white mb-2">Precision Intelligence</h4>
              <p className="text-sm text-slate-400">High-accuracy U-Net and YOLOv8 models process multi-spectral Sentinel-2 data to eliminate false positives.</p>
            </div>
            <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50 shadow-inner mt-0 sm:mt-8">
              <Globe className="w-10 h-10 text-emerald-500 mb-4" />
              <h4 className="text-lg font-bold text-white mb-2">Global Scalability</h4>
              <p className="text-sm text-slate-400">Designed to analyze vast geographies, empowering forest authorities with real-time remote surveillance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
