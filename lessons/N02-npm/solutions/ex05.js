function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

export function resolveScript(pkg, name) {
  const scripts = pkg.scripts ?? {};
  if (!(name in scripts)) {
    const best = Object.keys(scripts)
      .map((s) => ({ s, d: distance(name, s) }))
      .filter((x) => x.d <= 2)
      .sort((a, b) => a.d - b.d)[0];
    throw new Error(`Missing script: "${name}"` + (best ? `. Did you mean "${best.s}"?` : ''));
  }
  return [`pre${name}`, name, `post${name}`]
    .filter((n) => n in scripts)
    .map((n) => ({ name: n, command: scripts[n] }));
}

const CALL_RE = /npm\s+run(?:-script)?\s+([^\s&|;]+)/g;

export function scriptCycle(pkg, name) {
  const scripts = pkg.scripts ?? {};
  const visited = [];
  const stack = [];
  const seen = new Set();

  const dfs = (n) => {
    const at = stack.indexOf(n);
    if (at !== -1) throw new Error(`Cycle: ${[...stack.slice(at), n].join(' -> ')}`);
    if (seen.has(n)) return;
    seen.add(n);
    visited.push(n);
    stack.push(n);
    for (const m of String(scripts[n]).matchAll(CALL_RE)) {
      if (m[1] in scripts) dfs(m[1]);
    }
    stack.pop();
  };
  dfs(name);
  return visited;
}
