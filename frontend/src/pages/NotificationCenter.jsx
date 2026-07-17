import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBell, FiCheck, FiTrash2, FiSearch, FiFilter, FiActivity, FiClock } from 'react-icons/fi';
import NotificationCard from '../components/Notifications/NotificationCard';
import HistoryTimeline from '../components/History/HistoryTimeline'; // Ensure we use a timeline

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notifRes, histRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/notifications'),
        axios.get('http://127.0.0.1:8000/api/history')
      ]);
      setNotifications(notifRes.data);
      setHistory(histRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/api/notifications/read/all');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/notifications/read/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotif = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/notifications/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread' && n.is_read) return false;
    if (filter === 'read' && !n.is_read) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredHistory = history.filter(h => {
    if (search && !h.forest_name.toLowerCase().includes(search.toLowerCase()) && !h.status.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== 'all' && filter !== 'unread' && filter !== 'read' && h.severity.toLowerCase() !== filter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <FiBell className="text-emerald-500" />
            Activity Center
          </h1>
          <p className="text-slate-400 mt-1">Manage system alerts and view analysis history timeline.</p>
        </div>
        
        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${activeTab === 'notifications' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FiBell /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FiClock /> Analysis History
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={activeTab === 'notifications' ? "Search notifications..." : "Search forest regions..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="relative min-w-[200px]">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 appearance-none"
          >
            {activeTab === 'notifications' ? (
              <>
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </>
            ) : (
              <>
                <option value="all">All Severities</option>
                <option value="High">High Severity</option>
                <option value="Medium">Medium Severity</option>
                <option value="Low">Low Severity</option>
              </>
            )}
          </select>
        </div>
        {activeTab === 'notifications' && (
          <button onClick={markAllRead} className="px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/30 transition-colors flex items-center gap-2 whitespace-nowrap">
            <FiCheck /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading {activeTab}...</div>
        ) : activeTab === 'notifications' ? (
          filteredNotifs.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50 text-slate-400">
              <FiBell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No notifications found.</p>
            </div>
          ) : (
            filteredNotifs.map(notif => (
              <NotificationCard 
                key={notif.id} 
                notification={notif} 
                onMarkRead={() => markAsRead(notif.id)}
                onDelete={() => deleteNotif(notif.id)}
              />
            ))
          )
        ) : (
          filteredHistory.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50 text-slate-400">
              <FiClock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No analysis history found.</p>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="relative border-l-2 border-emerald-500/30 pl-6 space-y-8">
                {filteredHistory.map((h, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-slate-900"></span>
                    <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-slate-200">{h.forest_name}</h3>
                        <span className="text-xs text-slate-400">{h.date} at {h.time}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-slate-500 text-xs">Status</p>
                          <p className="text-emerald-400 font-medium">{h.status}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Severity</p>
                          <p className={`${h.severity === 'High' ? 'text-red-400' : h.severity === 'Medium' ? 'text-yellow-400' : 'text-emerald-400'} font-medium`}>{h.severity}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Health Score</p>
                          <p className="text-slate-200 font-medium">{h.health_score}/100</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Forest Loss</p>
                          <p className="text-slate-200 font-medium">{h.forest_loss_pct}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

