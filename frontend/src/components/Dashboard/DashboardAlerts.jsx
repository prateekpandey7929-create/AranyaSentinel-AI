import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = "http://127.0.0.1:8000/api/alerts";

export default function DashboardAlerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ pending: 0, escalated: 0, resolved: 0 });

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/`);
      if (res.ok) {
        const data = await res.json();
        // Calculate stats
        let p = 0, e = 0, r = 0;
        data.forEach(a => {
          if (a.status === 'Pending') p++;
          if (a.status === 'Escalated') e++;
          if (a.status === 'Resolved' || a.status === 'Acknowledged') r++;
        });
        setStats({ pending: p, escalated: e, resolved: r });
        
        // Keep top 3 for widget
        setAlerts(data.slice(0, 3));
      }
    } catch (err) {
      console.error("Failed to fetch dashboard alerts:", err);
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'Critical': return 'bg-red-100 text-red-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Medium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-blue-600" />
          Active Smart Alerts
        </h2>
        <button 
          onClick={() => navigate('/alerts')}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center justify-between">
            <div className="text-sm font-semibold text-orange-800">Pending</div>
            <div className="text-2xl font-black text-orange-600">{stats.pending}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-between">
            <div className="text-sm font-semibold text-red-800">Escalated</div>
            <div className="text-2xl font-black text-red-600">{stats.escalated}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center justify-between">
            <div className="text-sm font-semibold text-green-800">Acknowledged</div>
            <div className="text-2xl font-black text-green-600">{stats.resolved}</div>
          </div>
        </div>

        {/* Recent Alerts List */}
        <div className="lg:col-span-3 space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-200 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {alert.generated_date} {alert.generated_time}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800">{alert.forest_name}</h3>
                <p className="text-sm text-slate-600">{alert.alert_type} • Loss: {alert.forest_loss_percentage}%</p>
              </div>
              <div>
                {alert.status === 'Pending' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold border border-orange-200">
                    <Clock className="w-3.5 h-3.5" /> Action Required
                  </span>
                )}
                {alert.status === 'Escalated' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5" /> Escalated
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
