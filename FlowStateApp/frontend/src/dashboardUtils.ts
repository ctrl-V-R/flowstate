import type { Endpoint, LogEntry } from "./types";

export const calculateClusterHealth = (endpoints: Endpoint[]) => {
  const total = endpoints.length;
  if (total === 0) return { score: 0, status: 'CRITICAL' };

  const online = endpoints.filter(e => e.status === 'online').length;
  const score = (online / total) * 100;

  let status = 'STABLE';
  if (score < 90) status = 'DEGRADED';
  if (score < 50) status = 'CRITICAL';

  return { score, status };
};

export const getNodeTelemetry = (nodeId: string) => {
  const seed = nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    cpu: (seed % 30) + 10 + (Math.random() * 5),
    mem: (seed % 40) + 20,
    latency: (seed % 15) + 5
  };
};

export const calculateAvailability = (endpoints: Endpoint[]) => {
  if (endpoints.length === 0) return 0;
  const online = endpoints.filter(e => e.status === 'online').length;
  return (online / endpoints.length) * 100;
};

export const calculateAvgLatency = (endpoints: Endpoint[]) => {
  const onlineNodes = endpoints.filter(e => e.status === 'online' && e.metadata.latency);
  if (onlineNodes.length === 0) return 0;

  // Since withLatency added the same RTT to all, 
  // this average will reflect the actual API response time.
  const total = onlineNodes.reduce((acc, node) => acc + (node.metadata.latency || 0), 0);
  return Math.round(total / onlineNodes.length);
};

/**
 * Calculates percentage change between current and previous values
 * Returns a string like "+2.4%" or "-1.0%"
 */
export const getTrend = (current: number, previous: number) => {
  if (previous === 0) return { value: "Stable", isPositive: true };
  
  const diff = ((current - previous) / previous) * 100;
  return {
    value: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`,
    isPositive: diff >= 0
  };
};

export const formatLatencyHistory = (history: number[]) => {
  return history.map((val, index) => ({
    // Creates a "time" label based on index (e.g., -50s, -40s...)
    // Assuming 10s polling interval
    time: `${(history.length - index - 1) * -10}s`,
    val: val,
  }));
};

export const getKernelEvents = (logs: LogEntry[], limit: number = 15) => {
  return logs
    .filter((log) => log.type === "error" || log.type === "warn")
    .map((log) => ({
      ...log,
      // Optional: Clean up message strings or add specific kernel prefixes here
      tag: log.type === "error" ? "CRIT" : "WARN",
    }))
    .slice(-limit) // Get the most recent ones
    .reverse();    // Show newest at the top
};

