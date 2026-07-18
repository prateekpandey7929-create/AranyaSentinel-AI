import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Dashboard from "./pages/Dashboard";
import Analysis from "./pages/Analysis";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Knowledge from "./pages/Knowledge";
import NotificationCenter from "./pages/NotificationCenter";
import DroneSimulation from "./pages/DroneSimulation";
import AlertHistory from "./pages/AlertHistory";
import CloudRemoval from "./pages/CloudRemoval";
import LanguageSwitcher from "./components/LanguageSwitcher";

function NavLink({ to, icon, children }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to === "/" && location.pathname === "/dashboard");
  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive
          ? "bg-forest-600 text-white font-medium shadow-md shadow-forest-900/30 translate-x-1"
          : "text-slate-400 hover:bg-forest-950/40 hover:text-forest-300"
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

function Sidebar() {
  const { t } = useTranslation();

  return (
    <div className="w-64 glass-panel border-r border-forest-900/30 flex flex-col fixed inset-y-0 left-0 z-50 p-6">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-forest-900/20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-forest-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">{t('app_name')}</h1>
          <span className="text-xs text-forest-400 font-semibold tracking-widest uppercase">AI platform</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
        <NavLink
          to="/"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
          }
        >
          {t('nav_dashboard')}
        </NavLink>
        <NavLink
          to="/analyze"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 4L9 7" />
            </svg>
          }
        >
          {t('live_analysis')}
        </NavLink>

        <NavLink
          to="/knowledge"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        >
          {t('nav_knowledge')}
        </NavLink>
        <NavLink
          to="/notifications"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        >
          Notifications
        </NavLink>
        <NavLink
          to="/drone-simulation"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          }
        >
          Drone Simulation
        </NavLink>
        <div className="pt-4 mt-4 border-t border-slate-700/50">
        <NavLink
          to="/alerts"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        >
          Smart Alerts
        </NavLink>
        <NavLink
          to="/settings"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        >
          {t('nav_settings')}
        </NavLink>
        </div>
      </nav>

      <LanguageSwitcher />

      {/* Footer Info */}
      <div className="pt-6 border-t border-forest-900/20 text-center">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Developed with CUDA</span>
        <span className="text-xs text-slate-400 font-bold block mt-1">AS Platform v1.0.0</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-950 font-sans text-slate-200 selection:bg-forest-500/30">
        {/* Persistent Sidebar Navigation */}
        <Sidebar />
        
        {/* Dynamic Pages Area */}
        <div className="flex-1 ml-64 p-8 lg:p-12 relative z-0 min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analyze" element={<Analysis />} />
            <Route path="/history" element={<History />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/cloud-removal" element={<CloudRemoval />} />
            <Route path="/alerts" element={<AlertHistory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<NotificationCenter />} />
            <Route path="/drone-simulation" element={<DroneSimulation />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
