import { useState, useRef } from 'react';
import { Terminal as Loader2 } from 'lucide-react';
import { TerminalDialog } from './TerminalDialog';
import { COMMAND_REGISTRY } from '@/consolecommands';
import type { Endpoint } from '@/types';

const SUGGESTIONS = [
  { cmd: '/endpoint --list', desc: 'List all active endpoints' },
  { cmd: '/endpoint --rm', desc: 'Remove a specific endpoint' },
  { cmd: '/reboot', desc: 'Wipe session and reset uptime' },
  { cmd: '/flush', desc: 'Clear terminal console logs' },
  { cmd: '/health', desc: 'Show node system metrics' },
];

export default function LiveTerminal({ 
  endpoints, 
  setEndpoints 
}: { 
  endpoints: Endpoint[], 
  setEndpoints: any 
}) {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [_uptime, setUptime] = useState(0); 
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [pendingCommand, setPendingCommand] = useState('');
    
    // Logs Handler
    const [logs, setLogs] = useState<any[]>([
      { 
        msg: "FLOWSTATE ORCHESTRATOR v1.0.4 - INITIALIZING...", 
        type: "info", 
        time: new Date().toLocaleTimeString() 
      },
      { 
        msg: "READY. TYPE /HELP FOR AVAILABLE COMMANDS.", 
        type: "cmd", 
        time: new Date().toLocaleTimeString() 
      }
    ]);

    // Filter Suggestions
    const filteredSuggestions = SUGGESTIONS.filter(s => 
      s.cmd.startsWith(input) && input.length > 0
    );

    // --- addNotify ---
    const addNotify = (title: string, message: string, type: 'info' | 'warn' | 'error' | 'success') => {
            const timestamp = new Date().toLocaleTimeString();
            setLogs(prev => [...prev, { 
              msg: `[${title.toUpperCase()}] ${message}`,
              type: type, 
              time: timestamp
            }])
        }

    // ... onFormSubmit logic ...
    const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!input || isProcessing) return;

      const DANGEROUS_COMMANDS = ['/reboot', '/flush', '/endpoint --rm'];
      const isDangerous = DANGEROUS_COMMANDS.some(danger => input.startsWith(danger));

      if (isDangerous) {
        setPendingCommand(input);
        setIsDialogOpen(true);
        return;
      }

      executeFinal(input);
      setInput('');
    };

    const executeFinal = (fullCommand: string) => {
        const [base, ...args] = fullCommand.trim().split(' ');
        const timestamp = new Date().toLocaleTimeString()
        
        setLogs(prev => [...prev, { msg: fullCommand, type: 'cmd', time: timestamp }]);
        setIsProcessing(true);

        setTimeout(() => {
            const action = COMMAND_REGISTRY[base];

            if (action) {
                action(args, {
                    endpoints, 
                    setEndpoints,
                    setLogs,
                    setUptime,
                    addNotify,
                    log: (msg: string, type: any) => 
                        setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }])
                });
            } else {
                setLogs(prev => [...prev, { 
                    msg: `Unknown command: ${base}`, 
                    type: 'error', 
                    time: new Date().toLocaleTimeString() 
                }]);
            }
            setIsProcessing(false);
        }, 800);
    };
  return (
    <div className="p-8 h-[calc(100vh-120px)] flex flex-col gap-6">
      <div className="flex-1 bg-zinc-950 border border-zinc-800/50 rounded-2xl overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Terminal Header with Glowing Indicators */}
        <div className="bg-zinc-900/50 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex gap-2">
            <div className={`size-3 rounded-full border transition-all duration-300 
            ${isDialogOpen 
                ? 'bg-red-500 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-bounce' 
                : 'bg-red-500/10 border-red-500/30'}`} 
            />
            {/* Amber: Processing/Working */}
            <div className={`size-2.5 rounded-full border transition-all duration-500 ${isProcessing ? 'bg-amber-500 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse' : 'bg-amber-500/10 border-amber-500/20'}`} />
            {/* Green: Ready/Idle */}
            <div className={`size-2.5 rounded-full border transition-all duration-500 ${!isProcessing ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-emerald-500/10 border-emerald-500/20'}`} />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Session: root@flowstate-v1</span>
        </div>

        {/* Log Area */}
        <div ref={scrollRef} className="flex-1 p-6 font-mono text-sm overflow-y-auto space-y-2">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-zinc-600 shrink-0">[{log.time}]</span>
              <span className={log.type === 'cmd' ? 'text-primary' : 'text-zinc-300'}>
                {log.type === 'cmd' && <span className="mr-2">➜</span>}
                {log.msg}
              </span>
            </div>
          ))}
          {isProcessing && (
            <div className="flex items-center gap-2 text-zinc-500 italic">
              <Loader2 className="size-3 animate-spin" />
              <span>Synthesizing response...</span>
            </div>
          )}
        </div>

        {/* Command Suggestions UI */}
        {filteredSuggestions.length > 0 && (
          <div className="absolute bottom-20 left-6 right-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 animate-in slide-in-from-bottom-2">
            {filteredSuggestions.map((s, i) => (
              <button 
                key={i}
                onClick={() => { setInput(s.cmd) ; setLogs(prev => [...prev]); }}
                className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded-lg flex items-center justify-between group transition-colors"
              >
                <span className="text-primary font-mono text-sm">{s.cmd}</span>
                <span className="text-[10px] text-zinc-500 uppercase">{s.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={onFormSubmit} className="p-4 bg-zinc-900/30 border-t border-zinc-800 flex items-center gap-3">
          <span className={`font-bold transition-colors ${isProcessing ? 'text-zinc-700' : 'text-primary'}`}>➜</span>
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder={isProcessing ? "System busy..." : "Enter command..."}
            className="bg-transparent border-none outline-none text-zinc-300 w-full placeholder:text-zinc-700 disabled:cursor-wait"
          />
        </form>
      </div>
      <TerminalDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onConfirm={() => {
          executeFinal(pendingCommand);
          setIsDialogOpen(false);
          setPendingCommand('');
          setInput(''); // Clear input on cancel
        }} 
        command={pendingCommand}
      />
    </div>
  );}