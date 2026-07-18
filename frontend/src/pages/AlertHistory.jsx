import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Clock, AlertTriangle, Search, Filter, Mail, ChevronRight } from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000";

const AlertHistory = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/`);
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/acknowledge/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: "Acknowledged by officer." })
      });
      if (res.ok) {
        fetchAlerts();
        if (selectedAlert && selectedAlert.id === id) {
          setSelectedAlert(await res.json());
        }
      }
    } catch (err) {
      console.error("Failed to acknowledge:", err);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === "All" || alert.status === filter;
    const matchesSearch = alert.forest_name.toLowerCase().includes(search.toLowerCase()) || 
                          alert.alert_type.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-xs font-medium border border-orange-200"><Clock className="w-3 h-3" /> Pending</span>;
      case 'Acknowledged': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-medium border border-blue-200"><CheckCircle className="w-3 h-3" /> Acknowledged</span>;
      case 'Escalated': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-medium border border-red-200"><AlertTriangle className="w-3 h-3" /> Escalated</span>;
      case 'Resolved': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-medium border border-green-200"><CheckCircle className="w-3 h-3" /> Resolved</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-blue-600" />
            Smart Alerts History
          </h1>
          <p className="text-slate-500 mt-1">Track and manage automated forest monitoring alerts</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by forest name or alert type..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm w-full sm:w-auto bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Alert ID / Date</th>
                <th className="px-6 py-4 font-semibold">Forest & Issue</th>
                <th className="px-6 py-4 font-semibold">Severity</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Email Delivery</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading alerts...</td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No alerts found.</td>
                </tr>
              ) : (
                filteredAlerts.map(alert => (
                  <tr key={alert.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">#{alert.id}</div>
                      <div className="text-xs text-slate-400 mt-1">{alert.generated_date} <br/> {alert.generated_time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{alert.forest_name}</div>
                      <div className="text-xs text-slate-500 mt-1">{alert.alert_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded border text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(alert.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail className="w-3.5 h-3.5" />
                        {alert.email_delivery_status || 'Unknown'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[120px]">
                        {alert.status === 'Escalated' ? alert.escalated_email : alert.assigned_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedAlert(alert)}
                        className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
                Alert Details #{selectedAlert.id}
              </h3>
              <button 
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedAlert.forest_name}</h2>
                  <p className="text-sm text-slate-500 mt-1">{selectedAlert.alert_type}</p>
                </div>
                {getStatusBadge(selectedAlert.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Severity</div>
                  <div className={`inline-block px-2 py-0.5 rounded border text-sm font-semibold ${getSeverityColor(selectedAlert.severity)}`}>
                    {selectedAlert.severity}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Generated At</div>
                  <div className="text-sm font-medium text-slate-700">
                    {selectedAlert.generated_date} {selectedAlert.generated_time}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Forest Loss</div>
                  <div className="text-sm font-medium text-red-600">{selectedAlert.forest_loss_percentage}%</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Health Score</div>
                  <div className="text-sm font-medium text-slate-700">{selectedAlert.forest_health_score}/100</div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-slate-800 mb-4">Escalation Timeline</h4>
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                    <div className="text-sm font-medium text-slate-800">Alert Generated & Email Sent</div>
                    <div className="text-xs text-slate-500 mt-1">{selectedAlert.generated_date} {selectedAlert.generated_time}</div>
                    <div className="text-xs text-slate-400 mt-0.5">To: {selectedAlert.assigned_email} ({selectedAlert.email_delivery_status})</div>
                  </div>
                  
                  {selectedAlert.status !== 'Pending' && selectedAlert.acknowledged_date && (
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                      <div className="text-sm font-medium text-slate-800">Alert Acknowledged</div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(selectedAlert.acknowledged_date).toLocaleString()}</div>
                    </div>
                  )}

                  {selectedAlert.status === 'Escalated' && (
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                      <div className="text-sm font-medium text-red-600">Automatically Escalated</div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(selectedAlert.escalated_date).toLocaleString()}</div>
                      <div className="text-xs text-slate-400 mt-0.5">To: {selectedAlert.escalated_email}</div>
                    </div>
                  )}
                </div>
              </div>

            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              {selectedAlert.status === 'Pending' && (
                <button 
                  onClick={() => acknowledgeAlert(selectedAlert.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Acknowledge Alert
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertHistory;
