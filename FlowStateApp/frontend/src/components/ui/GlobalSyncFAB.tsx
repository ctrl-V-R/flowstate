import { Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GlobalSyncFABProps } from "@/types";

export function GlobalSyncFAB({ 
  connectionCount, 
  isPingingAll, 
  onPingAll, 
  lastSyncStatus 
}: GlobalSyncFABProps) {
  
  if (connectionCount === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Tooltip-style Label (Optional) */}
      <div className="hidden md:block px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-medium uppercase tracking-widest text-zinc-500 shadow-2xl">
        Ping All
      </div>

      <Button
        onClick={onPingAll}
        disabled={isPingingAll}
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-500 border-2 flex items-center justify-center p-0",
          isPingingAll 
            ? "bg-blue-600 border-blue-400 animate-pulse" 
            : lastSyncStatus === 'success'
            ? "bg-zinc-950 border-emerald-500/50 hover:border-emerald-500"
            : lastSyncStatus === 'error'
            ? "bg-zinc-950 border-red-500/50 hover:border-red-500"
            : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
        )}
      >
        {/* The Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className={cn(
                "transition-all duration-1000 ease-in-out",
                isPingingAll 
                ? "text-blue-500 opacity-100 [stroke-dasharray:175] [stroke-dashoffset:50] animate-[spin_3s_linear_infinite]" 
                : "text-transparent opacity-0 [stroke-dasharray:175] [stroke-dashoffset:175]"
            )}
            />
        </svg>
        {isPingingAll ? (
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        ) : (
          <div className="relative">
            <Activity className={cn(
              "h-6 w-6 transition-colors",
              lastSyncStatus === 'success' ? "text-emerald-500" : 
              lastSyncStatus === 'error' ? "text-red-500" : "text-zinc-400"
            )} />
            
            {/* Tiny indicator dot */}
            {lastSyncStatus !== 'idle' && (
              <span className={cn(
                "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-zinc-950",
                lastSyncStatus === 'success' ? "bg-emerald-500" : "bg-red-500"
              )} />
            )}
          </div>
        )}
      </Button>
    </div>
  );
}