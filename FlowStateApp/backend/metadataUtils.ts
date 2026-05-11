// backend/metaUtils.ts
import si from 'systeminformation';
import axios from 'axios';

interface Endpoint {
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
    latency?: number; 
    cpu?: number;
    ram?: number;
    lastSeen?: string;
  };
  enabledState: boolean;
}

export const enrichEndpointData = async (endpoint: Endpoint): Promise<Endpoint> => {
  const start = Date.now();
  
  try {
    // 1. Concurrent Execution: Ping the endpoint AND get System Stats
    // We use Promise.all to ensure we don't wait for one after the other
    const [systemStats, _] = await Promise.all([
      si.currentLoad(), 
      si.mem(),
      // We perform a lightweight HEAD request to the actual endpoint URL
      axios.head(endpoint.url, { timeout: 2500 }).catch(() => null) 
    ]);

    const end = Date.now();
    const rtt = end - start;

    return {
      ...endpoint,
      status: rtt < 2500 ? 'online' : 'offline',
      metadata: {
        ...endpoint.metadata,
        latency: rtt,
        cpu: Math.round(systemStats.currentLoad),
        // Simplified RAM calculation for the metadata field
        ram: Math.round((await si.mem()).active / (await si.mem()).total * 100),
        lastSeen: new Date().toISOString(),
      }

    };
  } catch (error) {
    return { 
      ...endpoint, 
      status: 'offline', 
      metadata: { ...endpoint.metadata, latency: 0 } 
    };
  }
};