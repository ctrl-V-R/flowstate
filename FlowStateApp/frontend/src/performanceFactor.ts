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

export const calculatePF = (endpoint: Endpoint, history: number[]): number => {
  const { metadata, status } = endpoint;
  if (status !== 'online') return 0;

  // 1. DERIVE STATS FROM HISTORY
  // We use the history passed from Dashboard props
  const p95 = getPercentile(history, 95);
  const jitter = calculateJitter(history);

  // 2. SCORING
  // Reliability (Success is 1.0 since status is online)
  const sReliability = 1.0;

  // Latency (Logarithmic penalty: feels okay until 200ms, then drops fast)
  const sLatency = Math.max(0, 1 - Math.log10(p95 / 100 + 1));

  // Stability (Jitter: high variance in ping is bad for UX)
  const sStability = Math.max(0, 1 - (jitter / 50));

  // Resource (CPU/RAM from metadata)
  const sResource = 1 //- (Math.max(metadata.cpu || 0, metadata.ram || 0) / 100);

  // 3. WEIGHTED FINAL (40% Reliability, 30% Latency, 20% Resource, 10% Stability)
  const score = (
    (sReliability * 0.4) + 
    (sLatency * 0.3) + 
    (sResource * 0.2) + 
    (sStability * 0.1)
  ) * 100;

  return Math.round(score);
};