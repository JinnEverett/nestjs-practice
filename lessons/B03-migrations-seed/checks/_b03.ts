// Helper dùng chung cho check B03: chạy script npm như người học, và thao tác migration trong tiến trình bằng DataSource của dự án.
import { spawnSync } from 'node:child_process';
import { DataSource } from 'typeorm';
import { repoPath } from './_kit';
import { DB_URL } from './_db';

export interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
  out: string;
  ms: number;
}

/** `npm run <script> -- <args>` trong thư mục gốc shop-api, với biến môi trường bổ sung (mặc định DATABASE_URL = DB test). */
export function npmRun(script: string, args: string[] = [], env: Record<string, string> = {}): RunResult {
  const started = Date.now();
  const win = process.platform === 'win32';
  const r = spawnSync(win ? 'npm.cmd' : 'npm', ['run', script, ...(args.length ? ['--', ...args] : [])], {
    cwd: repoPath('.'),
    env: { ...process.env, DATABASE_URL: DB_URL(), ...env },
    encoding: 'utf8',
    shell: win,
    maxBuffer: 1 << 26,
  });
  const stdout = (r.stdout ?? '').replace(/\u001b\[[0-9;]*m/g, '');
  const stderr = (r.stderr ?? '').replace(/\u001b\[[0-9;]*m/g, '');
  return { status: r.status, stdout, stderr, out: `${stdout}\n${stderr}`, ms: Date.now() - started };
}

/** DataSource của dự án (`src/database/data-source.ts`, export mặc định) đã khởi tạo; nhớ `destroy()`. */
export async function openProjectDataSource(): Promise<DataSource> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('../../src/database/data-source') as { default: DataSource };
  const ds = mod.default;
  if (!ds.isInitialized) await ds.initialize();
  return ds;
}

export async function appliedMigrations(ds: DataSource): Promise<string[]> {
  const exists = ((await ds.query(`SELECT to_regclass('public.migrations') AS t`)) as { t: string | null }[])[0].t;
  if (!exists) return [];
  return ((await ds.query('SELECT name FROM migrations ORDER BY id')) as { name: string }[]).map((r) => r.name);
}

/** Hoàn tác migration cho tới khi chỉ còn `keep` migration đã áp dụng. Trả về tên các migration đã hoàn tác (mới nhất trước). */
export async function revertDownTo(ds: DataSource, keep: number): Promise<string[]> {
  const reverted: string[] = [];
  for (let guard = 0; guard < 50; guard++) {
    const applied = await appliedMigrations(ds);
    if (applied.length <= keep) return reverted;
    // TypeORM luôn bọc việc LÙI trong transaction (bỏ qua `transaction = false` của migration) trừ khi chế độ là 'none';
    // down() có CREATE INDEX CONCURRENTLY chỉ chạy được với 'none' (CLI: `migration:revert -t none`).
    await ds.undoLastMigration({ transaction: 'none' });
    reverted.push(applied[applied.length - 1]);
  }
  throw new Error('revertDownTo: quá nhiều lần hoàn tác');
}

export const one = async <T = Record<string, unknown>>(ds: DataSource, sql: string, params: unknown[] = []): Promise<T> => ((await ds.query(sql, params)) as T[])[0];
