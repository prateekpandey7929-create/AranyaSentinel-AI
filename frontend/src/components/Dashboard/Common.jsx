import React from "react";

export function LoadingSpinner({ message }) {
  return (
    <div className="flex flex-col justify-center items-center py-10 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-forest-900/30 border-t-forest-400"></div>
      {message && <p className="text-xs text-slate-400 animate-pulse">{message}</p>}
    </div>
  );
}

export function ErrorPanel({ message, retryTrigger }) {
  return (
    <div className="glass-panel p-8 rounded-3xl text-center space-y-4 max-w-lg mx-auto">
      <div className="text-3xl text-rose-500"></div>
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Connection Failure</h3>
      <p className="text-xs text-slate-400 leading-relaxed">
        {message || "Failed to communicate with API servers. Please check if FastAPI backend server is running."}
      </p>
      {retryTrigger && (
        <button
          onClick={retryTrigger}
          className="bg-forest-600 hover:bg-forest-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
}
