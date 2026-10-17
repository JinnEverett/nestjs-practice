// bench.mjs — chạy 1 kịch bản HTTP ở nhiều mức tải (và mức dữ liệu), xuất bảng so sánh Markdown.
// Dùng qua bench.sh. Đặc tả: CLAUDE.md › Công cụ bench.
import autocannon from 'autocannon';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const scenarioArg = args[0];
if (!scenarioArg || scenarioArg.startsWith('--')) {
  console.error('Dùng: bench.sh <scenario> [--conns 1,10,100] [--data s,m] [--duration 10] [--runs 1] [--name x] [--base http://localhost:3000]');
  process.exit(2);
}
const scenarioPath = scenarioArg.endsWith('.json') ? scenarioArg : path.join(import.meta.dirname, 'scenarios', `${scenarioArg}.json`);
const scenario = JSON.parse(await readFile(scenarioPath, 'utf8'));
const conns = opt('conns', '1,10,100').split(',').map(Number);
const dataLevels = opt('data', '-').split(',');
const duration = Number(opt('duration', '10'));
const runs = Number(opt('runs', '1'));
const base = opt('base', scenario.base ?? 'http://localhost:3000');
const name = opt('name', path.basename(scenarioPath, '.json'));
const saveResult = !args.includes('--no-save');

// {{int:1:10000}} → số nguyên ngẫu nhiên trong khoảng, thay mới cho mỗi request.
const fill = (s) =>
  s?.replace(/\{\{int:(\d+):(\d+)\}\}/g, (_, a, b) => String(Math.floor(Number(a) + Math.random() * (Number(b) - Number(a) + 1))));
const templated = /\{\{/.test(JSON.stringify(scenario));

const baseOpts = (c, d) => ({
  url: base + (templated ? fill(scenario.path) : scenario.path),
  method: scenario.method ?? 'GET',
  headers: { 'content-type': 'application/json', ...(scenario.headers ?? {}) },
  body: scenario.body ? JSON.stringify(scenario.body) : undefined,
  connections: c,
  duration: d,
  timeout: Number(opt('timeout', '10')),
  requests: templated
    ? [{ setupRequest: (req) => ({ ...req, path: fill(scenario.path), body: scenario.body ? fill(JSON.stringify(scenario.body)) : undefined }) }]
    : undefined,
});

const once = (c, d) => new Promise((resolve, reject) => autocannon(baseOpts(c, d), (err, res) => (err ? reject(err) : resolve(res))));

const loopLag = async () => {
  try {
    const r = await fetch(base + '/_debug/loop', { signal: AbortSignal.timeout(2000) });
    if (!r.ok) return '';
    const j = await r.json();
    return j.p99Ms != null ? `${Number(j.p99Ms).toFixed(1)} ms` : '';
  } catch {
    return '';
  }
};
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const rows = [];
for (const data of dataLevels) {
  if (data !== '-') {
    const hook = process.env.BENCH_DATA_HOOK;
    if (!hook) {
      console.error('--data cần biến BENCH_DATA_HOOK trỏ tới script đổi DB (tạo ở B03), vd. BENCH_DATA_HOOK="bash shop-api/scripts/use-data.sh"');
      process.exit(2);
    }
    console.error(`→ chuyển dữ liệu sang ${data}`);
    execSync(`${hook} ${data}`, { stdio: 'inherit' });
  }
  for (const c of conns) {
    await once(c, 3); // warm-up 3s, bỏ kết quả
    await loopLag(); // reset histogram phía server
    const results = [];
    for (let i = 0; i < runs; i++) results.push(await once(c, duration));
    const lag = await loopLag();
    const rps = median(results.map((r) => r.requests.average));
    const p50 = median(results.map((r) => r.latency.p50));
    const p99 = median(results.map((r) => r.latency.p99));
    const errs = median(results.map((r) => r.errors + r.timeouts + r.non2xx));
    rows.push({ data, c, rps, p50, p99, errs, lag });
    console.error(`  data=${data} conns=${c}: ${rps.toFixed(0)} rps, p50 ${p50} ms, p99 ${p99} ms, lỗi ${errs}`);
  }
}

const date = new Date().toISOString().slice(0, 10);
const md = [
  `# bench · ${name} · ${date}`,
  '',
  `Kịch bản: \`${scenario.method ?? 'GET'} ${scenario.path}\` · base ${base} · ${duration}s/ô (warm-up 3s) · runs ${runs} (median)`,
  `Máy: ${process.platform} · Node ${process.version}. Giới hạn: client và server chạy cùng máy dev nên con số chỉ mang tính xu hướng.`,
  '',
  '| data | conns | RPS | p50 ms | p99 ms | lỗi / timeout / non-2xx | event loop lag p99 | ghi chú |',
  '|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.data} | ${r.c} | ${r.rps.toFixed(0)} | ${r.p50} | ${r.p99} | ${r.errs} | ${r.lag} | |`),
  '',
].join('\n');
console.log(md);
if (saveResult) {
  await mkdir(path.join(import.meta.dirname, 'results'), { recursive: true });
  const out = path.join(import.meta.dirname, 'results', `${date}-${name}.md`);
  await writeFile(out, md);
  console.error(`Đã lưu: ${out}`);
}
