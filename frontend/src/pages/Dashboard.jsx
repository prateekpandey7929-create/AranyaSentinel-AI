import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Dashboard Components
import HeroSection from "../components/Dashboard/HeroSection";
import AboutSection from "../components/Dashboard/AboutSection";
import CapabilityCards from "../components/Dashboard/CapabilityCards";
import StatisticsCards from "../components/Dashboard/StatisticsCards";
import WhySection from "../components/Dashboard/WhySection";
import WorkflowSection from "../components/Dashboard/WorkflowSection";

const API_BASE = "http://127.0.0.1:8000/dashboard";

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [workflow, setWorkflow] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [overviewRes, statsRes, workflowRes] = await Promise.all([
          axios.get(`${API_BASE}/overview`),
          axios.get(`${API_BASE}/statistics`),
          axios.get(`${API_BASE}/workflow`)
        ]);
        
        setOverview(overviewRes.data);
        setStatistics(statsRes.data);
        setWorkflow(workflowRes.data.steps);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-12 pb-24 fade-in max-w-7xl mx-auto pt-4 px-4 sm:px-6 lg:px-8">
      {/* 1. Welcome Hero */}
      <HeroSection 
        overview={overview} 
        onNavigate={navigate} 
      />

      {/* 2. About AranyaSentinel AI */}
      <AboutSection />

      {/* 3. Core Capabilities */}
      <CapabilityCards />

      {/* 4. Platform Statistics (Dynamic) */}
      <StatisticsCards 
        stats={statistics} 
        loading={loading} 
      />

      {/* 5. Why AranyaSentinel AI */}
      <WhySection />

      {/* 6. Project Workflow */}
      <WorkflowSection 
        steps={workflow} 
        loading={loading} 
      />
    </div>
  );
}
