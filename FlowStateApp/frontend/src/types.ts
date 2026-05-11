import type { Sidebar } from "./components/ui/sidebar";

// Endpoint (Base)
export interface Endpoint {
  id: string;
  name: string;
  url: string;
  status: string;
  lastSync: string;
  customKey: string;
  endpointSecret: string;
  useLLM: boolean;
  settings: {
    timeout: number;
    retries: number;
    headers: Record<string, string>;
  };
  metadata: {
    created_at: string;
    version: string;
    latency: number;
    statusCode?: number;
  };
  enabledState: boolean;
}

// ConnectionsView
export interface ConnectionsViewProps {
  onSuccess?: () => void;
  initialData?: Endpoint | null; // If null, we're in "add" mode. If Endpoint, we're in "edit" mode.
  fetchEndpoints: () => void;
}

//Dashboard Props
export interface DashboardProps {
  endpoints: Endpoint[];
  prevMetrics: {
    availability: number;
    latency: number;
  };
  allLogs: any[];
  latencyHistory: any[];
}

// Telemetry Data
export interface TelemetryData {
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  successRate: number; // 0 to 1
  cpuUsage: number;    // 0 to 100
  memUsage: number;    // 0 to 100
  jitter: number;
  isSyntheticValid: boolean;
}

// AuthGuard Child Prod
export interface AuthGuardProps {
  children: React.ReactNode
}

// App-sidebar Props
export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onLogout: () => void;
  user: {
    userId: string;
    role: "admin" | "viewer";
  } | null;
}

// Log Entry
export interface LogEntry {
  id: string;
  msg: string;
  type: 'info' | 'warn' | 'error' | 'success' | 'cmd';
  time: string;
}

// Console Commands
export interface CommandState {
  endpoints: Endpoint[];
  setEndpoints: React.Dispatch<React.SetStateAction<Endpoint[]>>;
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
  setUptime: React.Dispatch<React.SetStateAction<number>>;
  addNotify: (title: string, message: string, type: 'info' | 'warn' | 'error' | 'success') => void;
  log: (msg: string, type: 'info' | 'error' | 'warn' | 'cmd' | 'success') => void;
}

// LandingPage
export interface LandingPageProps {
  onAuthSuccess: (token: string, userRole: string) => void;
}

// DeleteDialog
export interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  endpointName: string;
  isLoading?: boolean; // Add this line (the '?' makes it optional)
}

// NavItem
export interface NavItem {
  title: string
  url: string
  icon?: React.ReactNode
}

// NotificationPage
export interface NotificationsPageProps {
  allLogs: LogEntry[];
  setHasUnreadAlerts: (val: boolean) => void;
}

// Settings User Data
export interface UserData {
  userId: string
  role: "admin" | "viewer"
  email: string
  initializedAt: string
}

// GlobalSync button
export interface GlobalSyncFABProps {
  connectionCount: number;
  isPingingAll: boolean;
  onPingAll: () => void;
  lastSyncStatus: 'idle' | 'success' | 'error';
}

// Node Card (DB)
export interface NodeStatusCardProps {
  node: Endpoint;
  performanceFactor: number;
}

// Signup Dialog
export interface SignupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupComplete: (token: string, userId: string, session_id: string) => void;
}

// Metric Card
export interface Metric {
  title: string
  value: string
  trend: string
  description?: string
}