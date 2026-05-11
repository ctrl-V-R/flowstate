import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { Routes, Route, useNavigate, Navigate } from "react-router-dom"
import LandingPage from "./LandingPage";
import EndpointsPage from "./components/EndpointList"
import { SiteFooter } from "./components/site-footer"
import { FSStats } from "./components/FSStats"
import Support from "./components/Support"
import LiveTerminal from "./components/LiveTerminal"
import type { Endpoint, LogEntry } from "./types"
import { getUserProfile, getEnrichedDashboard } from './connectionService';
import NotificationsPage from "./components/NotificationsPage"
import Dashboard from "./components/Dashboard"
import { calculateAvailability, calculateAvgLatency, getNodeTelemetry } from "./dashboardUtils"
import UserSettings from "./components/UserSettings"
import { AuthGuard } from "./AuthGuard"
import PNF from "./PNF"

const BASE_URL = "http://localhost:8000/api/v1"; // TODO : Switch with real base in PROD

export function AppContent() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("fs_access_token"));
  
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate()
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]); 
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [prevMetrics, setPrevMetrics] = useState({ availability: 0, latency: 0 });
  const [latencyHistory, setLatencyHistory] = useState<number[]>(new Array(20).fill(0));
  
  const isAuthenticated = !!token

  const [user, setUser] = useState(null);
  useEffect(() => {
    const initUser = async () => {
      try {
        const userData = await getUserProfile(); // From our connectionService
        setUser(userData);
      } catch (e) {
        console.error("Failed to load user session");
      }
    };
    
    if (isAuthenticated) initUser();
  }, [isAuthenticated]);

  // Main Logger
  const addGlobalLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      time: new Date().toLocaleTimeString()
    };

    setAllLogs(prev => [newEntry, ...prev]);

    if (entry.type === 'error' || entry.type === 'warn') {
      setHasUnreadAlerts(true);
    }
  };

  useEffect(() => {
    const checkSystemPressure = async () => {
      for (const node of endpoints) {
        const telemetry = await getNodeTelemetry(node.id);
        
        if (telemetry && telemetry.cpu > 85) {
          addGlobalLog({
            msg: `CRITICAL_LOAD: High CPU pressure on ${node.name} (${telemetry.cpu.toFixed(1)}%)`,
            type: 'warn',
            time: new Date().toLocaleTimeString()
          });
        }
      }
    };

    // Run the check every 10 seconds
    const interval = setInterval(checkSystemPressure, 10000);
    return () => clearInterval(interval);
  }, [endpoints]); // Re-run if endpoints list changes

  useEffect(() => {
    if (!token) {return;}
    const interval = setInterval(async () => {
      // Use the enriched dashboard data which contains the live monitoring results
      const data = await getEnrichedDashboard(addGlobalLog);
      if (!data) return;

      const avgLat = calculateAvgLatency(data);
      setLatencyHistory(prev => {
        const updated = [...prev, avgLat];
        return updated.slice(-20); 
      });
      data.forEach((node: Endpoint) => {
        const oldNode = endpoints.find((e: Endpoint) => e.id === node.id);
        if (oldNode && oldNode.status !== node.status) {
          addGlobalLog({
            msg: `${node.name} status changed from ${oldNode.status} to ${node.status}`,
            type: node.status === 'online' ? 'success' : 'error',
            time: new Date().toLocaleTimeString()
          });
        }
      });
 
      setEndpoints(data);
      const currentAvail = calculateAvailability(data);
      const currentLat = calculateAvgLatency(data);

      setPrevMetrics({ availability: currentAvail, latency: currentLat });

    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [endpoints]);

  // Logout
  const handleLogout = () => {
      localStorage.removeItem("fs_access_token")
      localStorage.removeItem("fs_session_start")
      setToken(null) 
      navigate("/", { replace: true })
    }
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getEnrichedDashboard();
        setEndpoints(data);
      } catch (err) {
        console.error("Initial load failed", err);
      }
    };
    loadData();
  }, []);
  
  useEffect(() => {
    // Check for token on mount
    async function loadDashboard() {
      const savedToken = localStorage.getItem("fs_access_token");
      if (!savedToken) {
        setIsLoading(false)
        return
      }
      setToken(savedToken);
      try {
        const response = await fetch(`${BASE_URL}/dashboard`, {
          headers: {
            "Authorization": `Bearer ${savedToken}`,
            "Content-Type": "application/json"
          }
        })

        if (response.status === 401) {
          // If the backend says unauthorized, clear local session
          handleLogout()
          return
        }

      } catch (error) {
        console.error("Failed to connect to FastAPI:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadDashboard();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="animate-pulse font-mono text-xs tracking-widest">INITIALIZING PROTOCOL...</p>
        </div>
      </div>
    );
  }

  // If no token, show Landing Page
  if (!token) {
    return (
      <Routes>
        <Route path="*" element={<LandingPage onAuthSuccess={(t) => setToken(t)} />} />
      </Routes>
    );

  }
  

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" onLogout={ handleLogout } user={user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-col flex-1">
          <div className="flex-1">
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<Dashboard endpoints={endpoints} prevMetrics={prevMetrics} allLogs={allLogs} latencyHistory={latencyHistory} />} />
            <Route path="/performance" element={<div className="p-8">CPU metrics coming soon...</div>} />
            <Route path="/notifications" element={<NotificationsPage allLogs={allLogs} setHasUnreadAlerts={setHasUnreadAlerts}/>} />
            <Route path="/syshealth" element={<FSStats />} />
            <Route path="/prompts" element={<div className="p-8">Prompt templates coming soon...</div>} />
            <Route path="/faq" element={<div className="p-8">FAQ coming soon...</div>} />
            <Route path="/support" element={<Support />} />

            {/* PRIVATE ROUTES {ADMIN ONLY} */}
            <Route path="/connections" element={<AuthGuard><EndpointsPage /></AuthGuard>}/>
            <Route path="/terminal" element={<AuthGuard><LiveTerminal endpoints={endpoints} setEndpoints={setEndpoints}/></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><UserSettings /></AuthGuard>} />

            {/* HELPER ROUTES */}
            <Route path="/404" element={<PNF />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
          </div>
          <SiteFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Page() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider delayDuration={0}>
          <AppContent />
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}