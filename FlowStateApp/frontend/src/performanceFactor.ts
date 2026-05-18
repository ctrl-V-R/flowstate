import type { Endpoint } from "./types";

/**
 * Statistical Helpers for latencyHistory
 */
const getPercentile = (data: number[], percentile: number) => {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
};

const calculateJitter = (data: number[]) => {
  if (data.length < 2) return 0;
  let totalDiff = 0;
  for (let i = 1; i < data.length; i++) {
    totalDiff += Math.abs(data[i] - data[i - 1]);
  }
  return totalDiff / (data.length - 1);
};

const getAverage = (data: number[]) => {
  if (data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0) / data.length;
};

/**
 * Calculates a Performance Factor score (0-100) for an endpoint
 * 
 * Scoring breakdown:
 * - 40% Availability/Status (online vs offline vs degraded)
 * - 30% Latency Performance (current + p95)
 * - 20% Consistency/Stability (jitter)
 * - 10% Status Code Health
 */
export const calculatePF = (endpoint: Endpoint, history: number[]): number => {
  const { metadata, status } = endpoint;
  
  // If not enough data, show conservative score
  if (history.length < 3) {
    if (status === 'online') return 75; // Neutral score
    if (status === 'paused') return 50;
    return 0; // offline
  }

  // 1. STATUS/AVAILABILITY SCORING (40%)
  let sAvailability = 0;
  if (status === 'online') {
    sAvailability = 1.0;
  } else if (status === 'degraded') {
    sAvailability = 0.6;
  } else if (status === 'paused') {
    sAvailability = 0.3;
  } else {
    // offline
    return 0;
  }

  // 2. LATENCY SCORING (30%)
  // Use both current latency and historical p95
  const currentLatency = metadata.latency || 0;
  const avgLatency = getAverage(history);
  const p95 = getPercentile(history, 95);
  
  // Weighted average favoring recent performance
  const effectiveLatency = (currentLatency * 0.5) + (avgLatency * 0.3) + (p95 * 0.2);
  
  // Score latency on a curve:
  // < 100ms = excellent (1.0)
  // 100-300ms = good (0.9-0.7)
  // 300-800ms = acceptable (0.7-0.4)
  // 800-2000ms = poor (0.4-0.1)
  // > 2000ms = very poor (0.0)
  let sLatency = 0;
  if (effectiveLatency < 100) {
    sLatency = 1.0;
  } else if (effectiveLatency < 300) {
    sLatency = 0.9 - ((effectiveLatency - 100) / 200) * 0.2; // 0.9 to 0.7
  } else if (effectiveLatency < 800) {
    sLatency = 0.7 - ((effectiveLatency - 300) / 500) * 0.3; // 0.7 to 0.4
  } else if (effectiveLatency < 2000) {
    sLatency = 0.4 - ((effectiveLatency - 800) / 1200) * 0.3; // 0.4 to 0.1
  } else {
    sLatency = Math.max(0, 0.1 - ((effectiveLatency - 2000) / 3000) * 0.1);
  }

  // 3. STABILITY SCORING (20%)
  // Jitter measures consistency - lower is better
  const jitter = calculateJitter(history);
  
  // Score based on jitter relative to average latency
  const jitterRatio = avgLatency > 0 ? jitter / avgLatency : 0;
  
  // < 10% jitter = excellent
  // 10-30% jitter = good
  // 30-50% jitter = acceptable
  // > 50% jitter = poor
  let sStability = 0;
  if (jitterRatio < 0.1) {
    sStability = 1.0;
  } else if (jitterRatio < 0.3) {
    sStability = 0.9 - ((jitterRatio - 0.1) / 0.2) * 0.2; // 0.9 to 0.7
  } else if (jitterRatio < 0.5) {
    sStability = 0.7 - ((jitterRatio - 0.3) / 0.2) * 0.3; // 0.7 to 0.4
  } else {
    sStability = Math.max(0, 0.4 - (jitterRatio - 0.5) * 0.4);
  }

  // 4. STATUS CODE HEALTH (10%)
  const statusCode = metadata.statusCode || 500;
  let sStatusCode = 0;
  if (statusCode >= 200 && statusCode < 300) {
    sStatusCode = 1.0; // Success
  } else if (statusCode >= 300 && statusCode < 400) {
    sStatusCode = 0.8; // Redirects (still working)
  } else if (statusCode >= 400 && statusCode < 500) {
    sStatusCode = 0.3; // Client errors (degraded)
  } else {
    sStatusCode = 0.1; // Server errors
  }

  // 5. WEIGHTED FINAL SCORE
  const score = (
    (sAvailability * 0.40) + 
    (sLatency * 0.30) + 
    (sStability * 0.20) + 
    (sStatusCode * 0.10)
  ) * 100;

  return Math.round(Math.max(0, Math.min(100, score)));
};

/**
 * Gets a human-readable performance grade based on PF score
 */
export const getPerformanceGrade = (pf: number): {
  grade: string;
  label: string;
  color: string;
} => {
  if (pf >= 90) {
    return { grade: 'A', label: 'Excellent', color: 'emerald' };
  } else if (pf >= 80) {
    return { grade: 'B', label: 'Good', color: 'green' };
  } else if (pf >= 70) {
    return { grade: 'C', label: 'Fair', color: 'yellow' };
  } else if (pf >= 60) {
    return { grade: 'D', label: 'Poor', color: 'orange' };
  } else if (pf > 0) {
    return { grade: 'F', label: 'Critical', color: 'red' };
  } else {
    return { grade: '-', label: 'Offline', color: 'slate' };
  }
};