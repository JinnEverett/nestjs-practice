// Chạy MỘT tệp e2e của người học (ở test/) trong tiến trình Jest riêng, với DATABASE_URL tùy chọn.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..', '..');
const jestBin = join(root, 'node_modules', 'jest', 'bin', 'jest.js');

export interface E2eResult {
  ok: boolean;
  output: string;
  tests: { name: string; status: string }[];
  ms: number;
}

export function runE2e(spec: string, o: { env?: Record<string, string>; args?: string[] } = {}): Promise<E2eResult> {
  const tmp = mkdtempSync(join(root, '.q02-'));
  const out = join(tmp, 'result.json');
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ['--experimental-vm-modules', jestBin, '--config', 'test/jest-e2e.json', '--runInBand', '--forceExit', '--json', `--outputFile=${out}`, ...(o.args ?? []), spec],
      { cwd: root, env: { ...process.env, NODE_OPTIONS: '', ...o.env } },
    );
    let output = '';
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('close', (code) => {
      const res: E2eResult = { ok: code === 0, output: output.slice(-3000), tests: [], ms: Date.now() - started };
      try {
        const json = JSON.parse(readFileSync(out, 'utf8'));
        res.tests = json.testResults.flatMap((f: { assertionResults: { title: string; fullName: string; status: string }[] }) =>
          f.assertionResults.map((a) => ({ name: a.fullName, status: a.status })),
        );
        if (json.numTotalTests === 0) res.ok = false;
      } catch {
        res.ok = false;
      }
      rmSync(tmp, { recursive: true, force: true });
      resolve(res);
    });
  });
}

export const failed = (r: E2eResult): string[] => r.tests.filter((t) => t.status === 'failed').map((t) => t.name);
