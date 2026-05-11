import { Card, CardContent } from "@/components/ui/card"
import type { NodeStatusCardProps } from "@/types";

export function NodeStatusCard({ node, performanceFactor }: NodeStatusCardProps) {
  // Determine color theme based on PF
  const isOptimal = performanceFactor >= 90;
  const isDegraded = performanceFactor < 90 && performanceFactor >= 70;
  
  const themeColor = isOptimal 
    ? "text-emerald-500 stroke-emerald-500" 
    : isDegraded 
      ? "text-amber-500 stroke-amber-500" 
      : "text-red-500 stroke-red-500";

  const glowClass = isOptimal 
    ? "shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
    : isDegraded 
      ? "shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
      : "shadow-[0_0_15px_rgba(239,68,68,0.1)]";

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
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[11px] font-bold truncate text-slate-200 tracking-tight uppercase">
                  {node.name}
                </h3>
              </div>
              <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${node.status === 'online' ? 'bg-emerald-500' : node.status === 'offline' ? 'bg-amber-500' : 'bg-red-500'} `}/>
            </div>

            {/* 3. METADATA GRID */}
            <div className="grid grid-cols-3 gap-2 mt-3 border-t border-white/5 pt-2">
              <MetricMini label="RTT" value={`${node.metadata.latency ?? 0}ms`} />
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