import { monitorEventLoopDelay } from 'node:perf_hooks';

const NS_PER_MS = 1e6;

export function createLoopMonitor({ resolution = 10 } = {}) {
  const h = monitorEventLoopDelay({ resolution });
  h.enable(); // timer nội bộ của histogram là unref → không giữ process sống

  const toMs = (ns) => (Number.isFinite(ns) ? ns / NS_PER_MS : 0);
  return {
    snapshot: () => ({ maxMs: toMs(h.max), p99Ms: toMs(h.percentile(99)), meanMs: toMs(h.mean) }),
    reset: () => h.reset(),
    stop: () => {
      h.disable();
    },
  };
}
