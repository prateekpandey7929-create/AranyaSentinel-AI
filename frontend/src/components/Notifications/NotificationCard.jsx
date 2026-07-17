import React from 'react';
import { FiInfo, FiAlertTriangle, FiFileText, FiActivity, FiCheck, FiTrash2 } from 'react-icons/fi';

export default function NotificationCard({ notification, onMarkRead, onDelete }) {
  const { title, description, type, priority, timestamp, is_read } = notification;

  const getIcon = () => {
    switch(type) {
      case 'Analysis': return <FiActivity className="text-blue-500" />;
      case 'Alert': return <FiAlertTriangle className="text-red-500" />;
      case 'Report': return <FiFileText className="text-emerald-500" />;
      default: return <FiInfo className="text-slate-400" />;
    }
  };

  const getPriorityColor = () => {
    switch(priority) {
      case 'High': return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'Medium': return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
      default: return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
    }
  };

  const timeString = new Date(timestamp).toLocaleString();

  return (
    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center transition-all ${
      is_read 
        ? 'bg-slate-800/20 border-slate-700/30 opacity-75' 
        : 'bg-slate-800/80 border-slate-600 shadow-lg'
    }`}>
      <div className="p-3 bg-slate-900 rounded-lg shrink-0">
        {getIcon()}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-semibold ${is_read ? 'text-slate-400' : 'text-slate-200'}`}>{title}</h3>
          {!is_read && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
        </div>
        <p className="text-slate-400 text-sm mb-2">{description}</p>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">{timeString}</span>
          <span className={`px-2 py-0.5 rounded-full border ${getPriorityColor()}`}>
            {priority}
          </span>
        </div>
      </div>

      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
        {!is_read && (
          <button 
            onClick={onMarkRead}
            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors tooltip-trigger"
            title="Mark as read"
          >
            <FiCheck />
          </button>
        )}
        <button 
          onClick={onDelete}
          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors tooltip-trigger"
          title="Delete"
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
}
