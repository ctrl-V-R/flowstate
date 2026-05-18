import { Card, CardContent } from "@/components/ui/card"
import type { NodeStatusCardProps } from "@/types";
import { getPerformanceGrade } from "@/performanceFactor";

export function NodeStatusCard({ node, performanceFactor }: NodeStatusCardProps) {
  const grade = getPerformanceGrade(performanceFactor);
  
  // Determine color theme based on PF
  const themeColor = 
    grade.color === 'emerald' ? "text-emerald-500 stroke-emerald-500" :
    grade.color === 'green' ? "text-green-500 stroke-green-500" :
    grade.color === 'yellow' ? "text-yellow-500 stroke-yellow-500" :
    grade.color === 'orange' ? "text-amber-500 stroke-amber-500" :
    grade.color === 'red' ? "text-red-500 stroke-red-500" :
    "text-slate-500 stroke-slate-500";

  const glowClass = 
    grade.color === 'emerald' ? "shadow-[0_0_15px_rgba(16,185,129,0.1)]" :
    grade.color === 'green' ? "shadow-[0_0_15px_rgba(34,197,94,0.1)]" :
    grade.color === 'yellow' ? "shadow-[0_0_15px_rgba(234,179,8,0.1)]" :
    grade.color === 'orange' ? "shadow-[0_0_15px_rgba(245,158,11,0.1)]" :
    grade.color === 'red' ? "shadow-[0_0_15px_rgba(239,68,68,0.1)]" :
    "shadow-[0_0_15px_rgba(100,116,139,0.1)]";

  const statusIndicatorColor = 
    node.status === 'online' ? 'bg-emerald-500' :
    node.status === 'degraded' ? 'bg-amber-500' :
    node.status === 'paused' ? 'bg-blue-500' :
    'bg-red-500';

  return (
    <Card className={`bg-[#0a0a0a] border-slate-800 transition-all duration-500 ${glowClass}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          
          {/* 1. PF RADIAL GAUGE */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="16"
                fill="none"
                className="stroke-white/5"
                strokeWidth="3.5"
              />
              <circle
                cx="18" cy="18" r="16"
                fill="none"
                className={`${themeColor} transition-all duration-1000 ease-in-out`}
                strokeWidth="3.5"
                strokeDasharray="100"
                strokeDashoffset={100 - performanceFactor}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-[11px] font-bold font-mono ${themeColor}`}>
                {performanceFactor}
              </span>
            </div>
          </div>

          {/* 2. IDENTITY & PRIMARY STATUS */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="text-[11px] font-bold truncate text-slate-200 tracking-tight uppercase">
                  {node.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${statusIndicatorColor} ${node.status === 'online' ? 'animate-pulse' : ''}`}/>
                  <span className="text-[8px] text-slate-500 uppercase font-mono">{node.status}</span>
                </div>
              </div>
              <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${themeColor} bg-white/5`}>
                {grade.grade}
              </div>
            </div>

            {/* 3. METADATA GRID */}
            <div className="grid grid-cols-3 gap-2 mt-2 border-t border-white/5 pt-2">
              <MetricMini label="RTT" value={`${node.metadata.latency ?? 0}ms`} />
              <MetricMini label="CODE" value={`${node.metadata.statusCode ?? '-'}`} />
              <MetricMini label="SYNC" value={node.lastSync || 'Never'} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">{label}</span>
      <span className="text-[9px] text-slate-300 font-mono leading-tight">{value}</span>
    </div>
  );
}