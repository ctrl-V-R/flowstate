import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardProps } from "@/types";
import { Activity, Globe, Zap, Heart } from "lucide-react";
import { calculateAvailability, calculateAvgLatency, calculateClusterHealth, formatLatencyHistory, getKernelEvents, getTrend } from "@/dashboardUtils";
import { useEffect, useMemo, useState } from "react";
import { Separator } from "./ui/separator";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ScrollArea } from "./ui/scroll-area";
import { calculatePF } from "@/performanceFactor";
import { NodeStatusCard } from "./ui/NodeStatusCard";
import { getEnrichedDashboard } from "@/connectionService";

const NetworkLoadGraph = ({ history }: { history: any[] }) => (
  <Card className="bg-[#0a0a0a] border-slate-800 overflow-hidden h-full">
    <CardHeader className="py-3 px-4">
      <CardTitle className="text-[10px] uppercase tracking-widest text-slate-500">Network Load</CardTitle>
    </CardHeader>
    <CardContent className="p-0 h-[120px]">
      <ChartContainer config={{ val: { label: "Latency", color: "#10b981" } }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <Area
              dataKey="val"
              type="monotone"
              stroke="#10b981"
              fill="rgba(16, 185, 129, 0.1)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </CardContent>
  </Card>
);

export default function Dashboard({ endpoints, prevMetrics, allLogs, latencyHistory }: DashboardProps) {
    
    const [data, setData] = useState(null);
    useEffect(() => {
      // Real polling every 10 seconds
      const interval = setInterval(async () => {
      const result = await getEnrichedDashboard();
        setData(result);
      }, 10000);
      
      return () => clearInterval(interval);
    }, []);

    const onlineCount = endpoints.filter(e => e.status === 'online').length;
    const totalNodes = endpoints.length;

    // Health
    const health = calculateClusterHealth(endpoints);

    // Availabiility
    const currentAvail = calculateAvailability(endpoints);
    const currentLat = calculateAvgLatency(endpoints);

    //Latency
    const availTrend = getTrend(currentAvail, prevMetrics.availability);
    const availStatus = availTrend.isPositive ? 'success' : 'danger'; 

    const latTrend = getTrend(currentLat, prevMetrics.latency);
    const latStatus = !latTrend.isPositive ? 'success' : 'warning';

    const chartData = useMemo(() => formatLatencyHistory(latencyHistory || []), [latencyHistory]);
    const kernelLogs = useMemo(() => getKernelEvents(allLogs), [allLogs]);

  return (
    <div className="flex flex-col gap-6 p-8 bg-[#020202] text-slate-200 min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-white">Analytics</h1>
          <p className="text-slate-500 text-sm font-mono">NODE_ORCHESTRATOR // STATUS: ACTIVE</p>
        </div>
        <Badge variant="outline" className="font-mono border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-3 py-1">
          SYSTEM: STABLE
        </Badge>
      </header>

      {/* Metric Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricItem 
          title="Availability" 
          value={`${currentAvail.toFixed(2)}%`} 
          icon={<Globe className="w-4 h-4" />} 
          trend={availTrend.value}
          trendStatus={availStatus}
          trendColor
        /> 
        <MetricItem 
          title="Live Nodes" 
          value={`${onlineCount}/${totalNodes}`} 
          icon={<Activity className="w-4 h-4" />} 
          description="Online Endpoints" 
          color="blue"
        />
        <MetricItem 
          title="Avg Latency" 
          value={`${currentLat.toFixed(0)}ms`} 

          trend={latTrend.value}
          trendStatus={latStatus} 
          icon={<Zap className="w-4 h-4" />}
        />
        <MetricItem 
          title="System Health" 
          value={`${health.score.toFixed(0)}%`} 
          icon={<Heart className="w-4 h-4" />} 
          status={health.status === 'STABLE' ? 'success' : 'warning'}
          description={`Cluster is operating in ${health.status} mode`}      
          color="slate"
        />
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Endpoint Health - Main Section */}
        <Card className="lg:col-span-2 bg-[#0a0a0a] border-slate-800 shadow-2xl">
          <CardHeader className="border-b border-white/5 py-4">
            <CardTitle className="text-xs uppercase tracking-widest text-slate-500">Managed Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {endpoints.map((node) => {
                // We calculate PF using the historical data we've been collecting in App.tsx
                const pf = calculatePF(node, latencyHistory);
                return (
                  <NodeStatusCard 
                    key={node.id} 
                    node={node} 
                    performanceFactor={pf} 
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel: System Logs & Load */}
        <div className="flex flex-col gap-6 h-full">
          
          {/* Top: The Graph */}
          <div className="h-[55%]">
            <NetworkLoadGraph history={chartData} />
          </div>

          {/* Bottom: The Logs */}
          <Card className="flex-1 bg-[#0a0a0a] border-slate-800 overflow-hidden flex flex-col">
            <CardHeader className="py-3 border-b border-white/5">
              <CardTitle className="text-[10px] uppercase tracking-widest text-slate-500 flex justify-between">
                Kernel Events
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 px-4 py-2">
              <div className="space-y-3">
                {kernelLogs.map((log: any, i: number) => (
                  <div key={i} className="group">
                    <div className="flex items-center gap-2 font-mono text-[9px]">
                      <span className={log.type === 'error' ? 'text-red-500' : 'text-amber-500'}>
                        [{log.tag}]
                      </span>
                      <span className="text-slate-600">{log.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">{log.msg}</p>
                    {i < kernelLogs.length - 1 && <Separator className="bg-white/5 mt-3" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}

{/* Internal Sub-Components for Cleanliness */}

function MetricItem({ title, value, icon, trend, trendStatus}: any) {
  
  const trendColor = trendStatus === 'success' ? 'text-emerald-500' : trendStatus === 'warning' ? 'text-amber-500' : 'text-red-500';

  const isUp = trend?.includes('+');

  return (
    <Card className="bg-[#0a0a0a] border-slate-800">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="p-2 rounded bg-white/5">{icon}</div>
          {trend && (
            <div className={`flex items-center gap-1 font-mono text-[10px] ${trendColor}`}>
              {isUp ? '↑' : '↓'} {trend.replace('+', '').replace('-', '')}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-[10px] uppercase text-slate-500 font-bold">{title}</p>
          <p className="text-2xl font-bold text-white tracking-tighter">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}