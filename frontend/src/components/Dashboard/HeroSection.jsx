import React, { useState, useEffect } from "react";
import { ArrowRight, MapPin } from "lucide-react";

export default function HeroSection({ overview, onNavigate }) {
  const [greeting, setGreeting] = useState("Welcome");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [location, setLocation] = useState("Resolving location...");

  // Dynamic greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Live Clock
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Reverse geocoding using OpenStreetMap Nominatim API (Free, no key required)
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            if (data && data.address) {
              const city = data.address.city || data.address.town || data.address.village || data.address.county || "Unknown City";
              const state = data.address.state || "Unknown State";
              setLocation(`${city}, ${state}`);
            } else {
              setLocation("Location Unavailable");
            }
          } catch (err) {
            setLocation("Location Unavailable");
          }
        },
        () => {
          setLocation("Location Permission Denied");
        }
      );
    } else {
      setLocation("Location Unavailable");
    }
  }, []);

  // For the demo, hardcode the officer name as dynamic requirement wasn't linked to auth profile yet
  const officerName = "Officer"; 

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-900/90 via-slate-900 to-slate-950 border border-forest-800/50 shadow-2xl p-8 md:p-12 lg:p-16 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-10">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-forest-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex-1 space-y-8 relative z-10">
        
        {/* Dynamic Context Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-sm font-medium text-emerald-400/80">
          <div className="flex items-center space-x-2 bg-emerald-900/20 border border-emerald-500/20 px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{currentDate} • {currentTime}</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 px-4 py-2 rounded-full text-slate-300">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span>{location}</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-medium text-slate-300">
            {greeting}, {officerName}
          </h2>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-forest-300">
              {overview?.greeting || "Welcome to AranyaSentinel AI"}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            {overview?.description || "AI-Powered Forest Monitoring & Geospatial Intelligence Platform"}
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
          <button 
            onClick={() => onNavigate('/analyze')}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center space-x-2 w-full sm:w-auto justify-center group"
          >
            <span>Launch Analysis Dashboard</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
