import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Users, 
  Zap,
  Globe, 
  Cpu, 
  Database, 
  Layers, 
  Lock
} from 'lucide-react';

export const FSStats = () => {
  const [metrics, setMetrics] = useState({
    active_sessions: 0,
    total_pings_24h: 0,
    system_health: 'optimal',
    cpu_load: 12,
    memory_usage: 4.2
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: number;

    const connectWebSocket = () => {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/stats';
      
      console.log('[FSStats] Connecting to WebSocket:', wsUrl);
      setConnectionStatus('connecting');
      
      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('[FSStats] WebSocket connected successfully');
          setConnectionStatus('connected');
          setReconnectAttempt(0);
          
          const connectLog = `[${new Date().toLocaleTimeString()}] SYSTEM_CONNECTED::WS_HANDSHAKE_COMPLETE`;
          setLogs(prev => [...prev.slice(-15), connectLog]);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[FSStats] Received metrics:', data);
            setMetrics(prev => ({ ...prev, ...data }));
            
            // Push new system log
            const newLog = `[${new Date().toLocaleTimeString()}] INBOUND_PACKET::SRC_RESOLVED::ID_${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
            setLogs(prev => [...prev.slice(-15), newLog]);
          } catch (error) {
            console.error('[FSStats] Error parsing message:', error);
          }
        };

        socket.onerror = (error) => {
          console.error('[FSStats] WebSocket error:', error);
          setConnectionStatus('error');
          
          const errorLog = `[${new Date().toLocaleTimeString()}] CONNECTION_ERROR::RETRY_PENDING`;
          setLogs(prev => [...prev.slice(-15), errorLog]);
        };

        socket.onclose = (event) => {
          console.log('[FSStats] WebSocket closed:', event.code, event.reason);
          setConnectionStatus('disconnected');
          
          const closeLog = `[${new Date().toLocaleTimeString()}] DISCONNECTED::CODE_${event.code}::ATTEMPTING_RECONNECT`;
          setLogs(prev => [...prev.slice(-15), closeLog]);
          
          // Reconnect with exponential backoff (max 30 seconds)
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
          console.log(`[FSStats] Reconnecting in ${delay}ms...`);
          
          reconnectTimeout = setTimeout(() => {
            setReconnectAttempt(prev => prev + 1);
            connectWebSocket();
          }, delay);
        };
      } catch (error) {
        console.error('[FSStats] Failed to create WebSocket:', error);
        setConnectionStatus('error');
      }
    };

    connectWebSocket();

    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [reconnectAttempt]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-mono p-4 grid grid-cols-12 grid-rows-6 gap-4 border-[12px] border-zinc-950">
      
      {/* --- HEADER / TOP NAV BAR (Span 12) --- */}
      <header className="col-span-12 row-span-1 flex items-center justify-between border border-zinc-800 bg-zinc-900/20 px-6 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="size-8 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-sm">
            <Layers className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-white font-bold tracking-tighter text-lg uppercase">FlowState // Sentinel_v3.4</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Global Infrastructure Monitoring Interface</p>
          </div>
        </div>
        <div className="flex gap-8 items-center h-full border-l border-zinc-800 pl-8">
          <HeaderStat label="Uptime" value="142:12:04:09" />
          <HeaderStat label="Link_Status" value="Encrypted" icon={<Lock className="size-3" />} />
          <div className={`px-4 py-2 border rounded ${
            connectionStatus === 'connected' ? 'bg-emerald-500/10 border-emerald-500/20' :
            connectionStatus === 'connecting' ? 'bg-yellow-500/10 border-yellow-500/20' :
            'bg-red-500/10 border-red-500/20'
          }`}>
             <span className={`text-xs ${
               connectionStatus === 'connected' ? 'text-emerald-500 animate-pulse' :
               connectionStatus === 'connecting' ? 'text-yellow-500' :
               'text-red-500'
             }`}>
               ● {connectionStatus === 'connected' ? 'SYSTEM_LIVE' : 
                  connectionStatus === 'connecting' ? 'CONNECTING...' :
                  connectionStatus === 'error' ? 'CONNECTION_ERROR' :
                  'RECONNECTING...'}
             </span>
          </div>
        </div>
      </header>

      {/* --- LEFT COLUMN: CORE METRICS (Span 3) --- */}
      <aside className="col-span-12 lg:col-span-3 row-span-5 flex flex-col gap-4">
        <MetricCard title="Active Nodes" value={metrics.active_sessions} sub="Nodes Online" icon={<Users />} />
        <MetricCard title="Total Throughput" value={metrics.total_pings_24h} sub="24h Aggregate" icon={<Zap />} color="text-primary" />
        
        {/* Resource Monitor Section */}
        <div className="flex-1 border border-zinc-800 bg-zinc-900/10 rounded-lg p-4 relative">
          <h3 className="text-[10px] font-bold text-zinc-500 mb-4 border-b border-zinc-800 pb-2 flex items-center gap-2">
            <Cpu className="size-3" /> RESOURCE_UTILIZATION
          </h3>
          <ResourceBar label="Processor Load" percent={metrics.cpu_load} color="bg-primary" />
          <ResourceBar label="Memory Buffer" percent={64} color="bg-emerald-500" />
          <ResourceBar label="Dynamo_IO" percent={21} color="bg-blue-500" />
          <div className="absolute bottom-4 left-4 right-4 opacity-10 flex flex-col gap-1">
             <div className="h-px bg-zinc-500 w-full" />
             <div className="h-px bg-zinc-500 w-3/4" />
          </div>
        </div>
      </aside>

      {/* --- CENTER: MAIN VISUALIZER (Span 6) --- */}
      <main className="col-span-12 lg:col-span-6 row-span-5 border border-zinc-800 bg-zinc-900/5 rounded-lg overflow-hidden flex flex-col relative">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/20">
          <span className="text-[10px] font-bold flex items-center gap-2"><Globe className="size-3" /> NETWORK_TRAFFIC_MAP</span>
          <div className="flex gap-2">
            <div className="size-2 rounded-full bg-zinc-800" />
            <div className="size-2 rounded-full bg-zinc-800" />
          </div>
        </div>
        
        {/* The "Centerpiece" - Placeholder for a Map or Logic Visualization */}
        <div className="flex-1 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
          <div className="relative text-center">
             <div className="size-64 border border-primary/20 rounded-full flex items-center justify-center animate-pulse">
                <div className="size-48 border border-primary/30 rounded-full flex items-center justify-center">
                  <Activity className="size-16 text-primary/40" />
                </div>
             </div>
             <p className="mt-4 text-[10px] text-zinc-600 tracking-[0.5em] uppercase">Visualizing_Data_Streams...</p>
          </div>
        </div>

        {/* Live System Logs (The Clutter) */}
        <div className="h-40 border-t border-zinc-800 bg-black/50 p-2 font-mono text-[9px] overflow-hidden">
          <div className="text-zinc-600 mb-1 border-b border-zinc-900 pb-1 flex justify-between">
            <span>TERMINAL_LOG_OUTPUT</span>
            <span>UTF-8</span>
          </div>
          <div className="flex flex-col gap-0.5 opacity-60">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-zinc-700">[{i}]</span>
                <span className={i === logs.length -1 ? "text-emerald-500" : ""}>{log}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* --- RIGHT COLUMN: SUB-SYSTEMS (Span 3) --- */}
      <aside className="col-span-12 lg:col-span-3 row-span-5 flex flex-col gap-4">
        <SubsystemItem label="DYNAMO_DB_CLUSTER" status="Online" value="99.9% SL" />
        <SubsystemItem label="AUTH_GATEWAY_V1" status="Secure" value="0.04ms" />
        <SubsystemItem label="AWS_LAMBDA_RUNTIME" status="Ready" value="Node18.x" />
        
        <div className="mt-auto border border-zinc-800 bg-zinc-900/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-zinc-500">
            <Database className="size-3" /> STORAGE_INFO
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span>Primary Disk</span>
            <span className="text-white">14.2 / 50 GB</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[28%]" />
          </div>
        </div>
      </aside>

    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const HeaderStat = ({ label, value, icon }: { label: string, value: string, icon?: any }) => (
  <div className="flex flex-col">
    <span className="text-[8px] uppercase tracking-tighter text-zinc-500 font-bold">{label}</span>
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs text-zinc-200 font-bold">{value}</span>
    </div>
  </div>
);

const MetricCard = ({ title, value, sub, icon, color = "text-white" }: any) => (
  <div className="border border-zinc-800 bg-zinc-900/10 p-4 rounded-lg group hover:border-zinc-700 transition-colors">
    <div className="flex justify-between items-start mb-2 text-zinc-500">
      <div className="p-2 bg-zinc-950 border border-zinc-800 rounded group-hover:text-primary transition-colors">
        {React.cloneElement(icon, { size: 16 })}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest">{title}</span>
    </div>
    <div className={`text-3xl font-bold tracking-tighter ${color}`}>{value}</div>
    <div className="text-[9px] text-zinc-600 uppercase mt-1 tracking-tighter">{sub}</div>
  </div>
);

const ResourceBar = ({ label, percent, color }: any) => (
  <div className="mb-4">
    <div className="flex justify-between text-[9px] uppercase font-bold mb-1">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300">{percent}%</span>
    </div>
    <div className="h-1 bg-zinc-800/50 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }} />
    </div>
  </div>
);

const SubsystemItem = ({ label, status, value }: any) => (
  <div className="border border-zinc-800/50 bg-zinc-900/5 p-3 rounded-md flex justify-between items-center group cursor-default hover:bg-zinc-900/20">
    <div className="flex flex-col">
      <span className="text-[9px] font-bold text-zinc-400 group-hover:text-white transition-colors">{label}</span>
      <span className="text-[8px] text-zinc-600 uppercase">{status}</span>
    </div>
    <div className="text-[10px] font-bold text-zinc-500 font-mono">[{value}]</div>
  </div>
);