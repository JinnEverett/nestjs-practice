// Chạy file spec đơn vị của người học trong một bản sao tạm của src/ (có thể thay một vài file bằng "mutant").
// Dùng cho Q01: spec tốt phải XANH với code đúng và ĐỎ với code sai.
import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = join(__dirname, '..', '..'); // test/_checks → shop-api
const jestBin = join(root, 'node_modules', 'jest', 'bin', 'jest.js');

export interface RunOptions {
  /** relPath (từ shop-api, vd. 'src/pricing/pricing.service.ts') → nội dung thay thế */
  replace?: Record<string, string>;
  /** Ghi thêm file vào bản sao */
  extraFiles?: Record<string, string>;
  coverageFor?: string[];
  extraArgs?: string[];
  assertionsRequired?: boolean;
}
export interface RunResult {
  ok: boolean;
  output: string;
  tests: { name: string; status: string }[];
  branchPct?: number;
}

export function runSpec(specs: string | string[], opts: RunOptions = {}): Promise<RunResult> {
  const tmp = mkdtempSync(join(root, '.mut-'));
  cpSync(join(root, 'src'), join(tmp, 'src'), { recursive: true });
  for (const [rel, content] of Object.entries({ ...opts.replace, ...opts.extraFiles })) {
    const dest = join(tmp, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, content);
  }
  const setup = join(tmp, 'setup.js');
  writeFileSync(setup, opts.assertionsRequired ? 'beforeEach(() => { expect.hasAssertions(); });\n' : '');
  const config = {
    rootDir: tmp,
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'json', 'ts'],
    testRegex: '\\.spec\\.ts$',
    transform: { '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: join(root, 'tsconfig.json'), diagnostics: false }] },
    setupFilesAfterEnv: [setup],
    ...(opts.coverageFor
      ? {
          collectCoverage: true,
          coverageReporters: ['json-summary'],
          coverageDirectory: join(tmp, 'cov'),
          collectCoverageFrom: opts.coverageFor,
        }
      : {}),
  };
  const out = join(tmp, 'result.json');
  const args = [
    '--experimental-vm-modules', jestBin, '--config', JSON.stringify(config), '--runInBand', '--json',
    `--outputFile=${out}`, ...(opts.extraArgs ?? []), ...(Array.isArray(specs) ? specs : [specs]),
  ];
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, NODE_OPTIONS: '' } });
    let output = '';
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('close', (code) => {
      const res: RunResult = { ok: code === 0, output: output.slice(-4000), tests: [] };
      try {
        const json = JSON.parse(readFileSync(out, 'utf8'));
        res.tests = json.testResults.flatMap((f: { assertionResults: { title: string; status: string }[] }) =>
          f.assertionResults.map((a) => ({ name: a.title, status: a.status })),
        );
        if (json.numTotalTests === 0 || json.testResults.some((f: { message?: string; status: string }) => f.status === 'failed' && f.message?.includes('Test suite failed to run'))) {
          res.ok = false;
        }
      } catch {
        res.ok = false;
      }
      if (opts.coverageFor) {
        try {
          const cov = JSON.parse(readFileSync(join(tmp, 'cov', 'coverage-summary.json'), 'utf8'));
          res.branchPct = cov.total.branches.pct;
        } catch {
          res.branchPct = 0;
        }
      }
      rmSync(tmp, { recursive: true, force: true });
      resolve(res);
    });
  });
}

export interface Mutant {
  name: string;
  edits: [from: string, to: string][];
}

/** Áp dụng mutant lên bản tham chiếu; mỗi `from` phải xuất hiện đúng một lần. */
export function mutate(ref: string, mutant: Mutant): string {
  let text = ref;
  for (const [from, to] of mutant.edits) {
    const first = text.indexOf(from);
    if (first < 0 || text.indexOf(from, first + 1) >= 0) throw new Error(`mutant "${mutant.name}": "${from}" phải xuất hiện đúng 1 lần`);
    text = text.replace(from, () => to);
  }
  return text;
}

export function readRef(name: string): string {
  return readFileSync(join(__dirname, name), 'utf8');
}

/** Chạy các mutant (tối đa 3 song song), trả về tên những mutant SỐNG SÓT (spec vẫn xanh). */
export async function survivors(
  specs: string | string[],
  target: string,
  refFile: string,
  mutants: Mutant[],
  extra: Omit<RunOptions, 'replace'> = {},
): Promise<{ survived: string[]; killed: number }> {
  const ref = readRef(refFile);
  const survived: string[] = [];
  let index = 0;
  const worker = async () => {
    while (index < mutants.length) {
      const m = mutants[index++];
      const r = await runSpec(specs, { ...extra, replace: { [target]: mutate(ref, m) } });
      if (r.ok) survived.push(m.name);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return { survived, killed: mutants.length - survived.length };
}
