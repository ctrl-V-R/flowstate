import type { NotificationsPageProps } from '@/types';
import React, { useState } from 'react'



export default function NotificationsPage({ allLogs, setHasUnreadAlerts }: NotificationsPageProps) {
  const [filter, setFilter] = useState<'all' | 'warn' | 'error'>('all');
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  // Mark alerts as read when the user visits this page
  React.useEffect(() => {
    setHasUnreadAlerts(false);
  }, [setHasUnreadAlerts]);

  // Priority Box Logic: Filter for critical types and remove "checked off" items
  const priorityLogs = allLogs.filter((log) => {
    const isPriority = log.type === 'error' || log.type === 'warn';
    const isNotResolved = !resolvedIds.has(log.id);
    const matchesFilter = filter === 'all' || log.type === filter;
    return isPriority && isNotResolved && matchesFilter;
  });

  const handleResolve = (id: string) => {
    setResolvedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full gap-4 p-6 bg-[#050505] text-slate-300 font-sans">
      
      {/* --- TOP TERMINAL: PRIORITY ALERTS --- */}
      <section className="flex-[4] min-h-[300px] flex flex-col rounded-lg border border-red-900/30 bg-[#0a0505] shadow-2xl overflow-hidden">
        <div className="px-4 py-2 bg-red-950/20 border-b border-red-900/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-red-500">Critical Incidents</h2>
          </div>
          
          <div className="flex gap-1 bg-black/40 p-1 rounded-md border border-white/5">
            {(['all', 'warn', 'error'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 text-[10px] uppercase rounded transition-all ${
                  filter === t ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {priorityLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 italic text-sm">
              No active threats detected in cluster scope.
            </div>
          ) : (
            priorityLogs.map((log) => (
              <div 
                key={log.id} 
                className={`flex items-center justify-between p-3 mb-2 rounded border animate-in fade-in slide-in-from-top-2 duration-300 ${
                  log.type === 'error' 
                    ? 'bg-red-500/5 border-red-500/20' 
                    : 'bg-yellow-500/5 border-yellow-500/20'
                }`}
              >
                <div className="flex gap-4 items-start">
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full ${log.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{log.msg}</p>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">
                      {log.time}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleResolve(log.id)}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-green-400 transition-colors"
                  title="Acknowledge & Resolve"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* --- BOTTOM TERMINAL: LIVE STREAM --- */}
      <section className="flex-[6] flex flex-col rounded-lg border border-slate-800 bg-black shadow-inner overflow-hidden">
        <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Live Event Orchestrator Stream</h2>
          <span className="text-[10px] text-slate-600 font-mono">STATUS: CONNECTED</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 custom-scrollbar">
          {allLogs.length === 0 && (
            <span className="text-slate-700">Waiting for incoming packets...</span>
          )}
          {allLogs.map((log) => (
            <div key={log.id} className="group flex gap-3 hover:bg-white/[0.02] py-0.5 px-1 rounded">
              <span className="text-slate-600 shrink-0">[{log.time}]</span>
              <span className={`shrink-0 font-bold ${
                log.type === 'error' ? 'text-red-500' : 
                log.type === 'warn' ? 'text-yellow-500' : 
                log.type === 'success' ? 'text-emerald-500' : 'text-blue-400'
              }`}>
                {log.type.toUpperCase()}
              </span>
              <span className="text-slate-300 break-all">{log.msg}</span>
            </div>
          ))}
        </div>
      </section>

      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #444;
          }
        `}
      </style>
    </div>
  );
}