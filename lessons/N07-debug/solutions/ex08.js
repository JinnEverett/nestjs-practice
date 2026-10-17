const nums = (samples, key) => samples.map((s) => s[key]).filter((v) => typeof v === 'number' && Number.isFinite(v));
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

function regression(ys) {
  const n = ys.length;
  const xs = ys.map((_, i) => i);
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const r2 = sxx === 0 || syy === 0 ? 0 : (sxy * sxy) / (sxx * syy);
  return { slope, r2 };
}

export function diagnose(samples) {
  if (samples.length < 5) return { verdict: 'insufficient-data', evidence: ['need >= 5 samples'] };

  const heap = nums(samples, 'heapMb');
  if (heap.length >= 10) {
    const { slope, r2 } = regression(heap);
    if (slope > 0.5 && r2 >= 0.9 && heap.at(-1) >= heap[0] * 1.3) {
      return {
        verdict: 'memory-leak',
        evidence: [`heapMb grows ${slope.toFixed(2)} MB/sample (R²=${r2.toFixed(2)}), ${heap[0]} → ${heap.at(-1)}`],
      };
    }
  }

  const lag = nums(samples, 'loopLagMs');
  const blocked = lag.filter((v) => v > 100).length;
  if (blocked >= 3) {
    return { verdict: 'event-loop-blocked', evidence: [`loopLagMs > 100 in ${blocked} samples (max ${Math.max(...lag)})`] };
  }

  const waiting = nums(samples, 'dbPoolWaiting');
  const cpu = nums(samples, 'cpuPct');
  if (waiting.length > 0 && cpu.length > 0) {
    const share = waiting.filter((v) => v > 0).length / waiting.length;
    if (share >= 0.3 && mean(cpu) < 60) {
      return { verdict: 'pool-exhausted', evidence: [`dbPoolWaiting > 0 in ${(share * 100).toFixed(0)}% of samples while cpuPct avg ${mean(cpu).toFixed(0)}`] };
    }
  }

  const p99 = nums(samples, 'p99Ms');
  const up = nums(samples, 'upstreamMs');
  if (p99.length > 0 && up.length > 0) {
    const m99 = median(p99);
    const mup = median(up);
    const lagAvg = lag.length > 0 ? mean(lag) : 0;
    if (m99 > 1000 && mup >= 0.6 * m99 && lagAvg < 50) {
      return { verdict: 'slow-upstream', evidence: [`median p99Ms ${m99}, median upstreamMs ${mup} (loop lag avg ${lagAvg.toFixed(0)})`] };
    }
  }
  return { verdict: 'healthy', evidence: [] };
}
