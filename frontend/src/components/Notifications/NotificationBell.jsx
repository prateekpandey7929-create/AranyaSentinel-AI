import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const fetchUnread = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/notifications/unread');
      setNotifications(res.data.slice(0, 5)); // Top 5
      setUnreadCount(res.data.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors relative"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] items-center justify-center text-white font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-200">Notifications</h3>
            <button 
              onClick={() => { setShowDropdown(false); navigate('/notifications'); }}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              View All
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No new notifications
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="p-3 border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer" onClick={() => { setShowDropdown(false); navigate('/notifications'); }}>
                  <p className="text-sm text-slate-200 font-medium mb-1">{notif.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-2">{notif.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
