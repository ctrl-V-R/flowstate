import type { Endpoint, LogEntry } from '@/types';

type LogCallback = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;

// 1. DYNAMIC AUTH: Pull from localStorage instead of hardcoding "AAAAAA"
const getHeaders = () => {
  const token = localStorage.getItem("fs_access_token") || "";
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
};

const BASE_URL = "http://localhost:8000/api/v1";

export const getEnrichedDashboard = async (onLog?: LogCallback) => {
  try {
    const response = await fetch(`${BASE_URL}/dashboard`, {
      headers: getHeaders()
    });

    if (response.status === 401) {
      onLog?.({ msg: "Session expired or invalid. Re-authenticating...", type: "error", time: new Date().toLocaleTimeString() });
      // Optional: window.location.href = "/login";
      return [];
    }

    const data = await response.json();
    // Our FastAPI backend returns { "cache": { "endpoints": [...] }, "user_role": "..." }
    return data.cache.endpoints; 
  } catch (error) {
    onLog?.({ msg: "Failed to connect to backend engine", type: "error", time: new Date().toLocaleTimeString() });
    throw error;
  }
};

export const fetchEndpoints = async (onLog?: LogCallback): Promise<Endpoint[]> => {
  onLog?.({ msg: "Connections Pinged!", type: "info", time: new Date().toLocaleTimeString() });
  
  const response = await fetch(`${BASE_URL}/connections`, { headers: getHeaders() });
  
  if (!response.ok) {
    const errorData = await response.json();
    onLog?.({ msg: `Access Denied: ${errorData.detail || "500 Server Error"}`, type: "error", time: new Date().toLocaleTimeString() });
    throw new Error("Failed to fetch");
  }
  
  return await response.json();
};

export const addEndpoint = async (endpointData: Partial<Endpoint>, onLog?: LogCallback): Promise<boolean> => {
  onLog?.({ msg: "POST /api/v1/connections (Admin Write)", type: "info", time: new Date().toLocaleTimeString() });

  const response = await fetch(`${BASE_URL}/connections`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(endpointData)
  });

  if (response.status === 403) {
    onLog?.({ msg: "Permission Denied: Viewer role cannot create nodes.", type: "error", time: new Date().toLocaleTimeString() });
    return false;
  }

  return response.ok;
};

export const deleteEndpoint = async (id: string, name: string, onLog?: LogCallback): Promise<boolean> => {
  onLog?.({ msg: `DELETE /api/v1/connections/${name}`, type: "warn", time: new Date().toLocaleTimeString() });
  
  const response = await fetch(`${BASE_URL}/connections/${id}`, {
    method: "DELETE",
    headers: getHeaders()
  });
  
  if (response.ok) {
    onLog?.({ msg: `Node ${name} de-provisioned successfully`, type: "success", time: new Date().toLocaleTimeString() });
  } else if (response.status === 403) {
    onLog?.({ msg: `Unauthorized: Admin passkey required to delete ${name}`, type: "error", time: new Date().toLocaleTimeString() });
  }

  return response.ok;
};

export const pingAllEndpoints = async (onLog?: LogCallback): Promise<boolean> => {
  onLog?.({ 
    msg: "Broadcasting Global Sync Signal...", 
    type: "info", 
    time: new Date().toLocaleTimeString() 
  });
  
  try {
    const response = await fetch(`${BASE_URL}/connections/ping-all`, { 
      method: "POST", 
      headers: getHeaders() 
    });
    
    if (response.ok) {
      onLog?.({ 
        msg: "Global Refresh Successful: Active Cache Updated", 
        type: "success", 
        time: new Date().toLocaleTimeString() 
      });
      return true;
    } 

    if (response.status === 403) {
      onLog?.({ 
        msg: "Action Denied: Viewers cannot trigger manual sync.", 
        type: "error", 
        time: new Date().toLocaleTimeString() 
      });
    }
    return false;

  } catch (error) {
    onLog?.({ 
      msg: "Network Error: Could not reach Monitoring Engine", 
      type: "error", 
      time: new Date().toLocaleTimeString() 
    });
    return false;
  }
};

export const getUserProfile = async () => {
  const response = await fetch(`${BASE_URL}/user/profile`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return await response.json(); // Returns { userId, role, email, ... }
};