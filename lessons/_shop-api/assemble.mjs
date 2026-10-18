#!/usr/bin/env node
// Dựng shop-api THAM CHIẾU ở lessons/.shop-ref/ = base + overlay (solutions/) của các module ≤ <ID> theo ORDER.md.
// Dùng bởi: bash lessons/check.sh <bài C+> <NN|all> --solutions
// Dùng: node lessons/_shop-api/assemble.mjs <ID>
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const lessons = resolve(here, '..');
const ref = join(lessons, '.shop-ref');
const base = join(here, 'base');
const target = process.argv[2];
if (!target) { console.error('Thiếu ID module'); process.exit(2); }

const order = readFileSync(join(here, 'ORDER.md'), 'utf8')
  .split(/\r?\n/)
  .map((l) => /^\s*[-*]\s+([A-Z]+\d*[a-z]?)\b/.exec(l)?.[1])
  .filter(Boolean);
const idx = order.indexOf(target);
if (idx < 0) { console.error(`Module ${target} không có trong _shop-api/ORDER.md`); process.exit(2); }

const lessonDir = (id) => {
  const name = readdirSync(lessons).find((n) => n.startsWith(`${id}-`) && statSync(join(lessons, n)).isDirectory());
  return name ? join(lessons, name) : null;
};

mkdirSync(ref, { recursive: true });
for (const d of ['src', 'test', 'migrations', 'db', 'scripts', 'dist', 'docker']) rmSync(join(ref, d), { recursive: true, force: true });
cpSync(base, ref, { recursive: true, filter: (s) => basename(s) !== 'package.json' });

const pkg = JSON.parse(readFileSync(join(base, 'package.json'), 'utf8'));
const applied = [];
for (const id of order.slice(0, idx + 1)) {
  const dir = lessonDir(id);
  const sol = dir && join(dir, 'solutions');
  if (!sol || !existsSync(sol)) continue;
  cpSync(sol, ref, {
    recursive: true,
    filter: (s) => !/[\\/](DEPS|NPM_SCRIPTS)$/.test(s) && !(dirname(s) === sol && s.endsWith('.md')),
  });
  const depsFile = join(sol, 'DEPS');
  if (existsSync(depsFile)) {
    for (const line of readFileSync(depsFile, 'utf8').split(/\r?\n/)) {
      const m = /^\s*(dependencies|dev)\s+(\S+)@(\S+)\s*$/.exec(line);
      if (!m) continue;
      const group = m[1] === 'dev' ? 'devDependencies' : 'dependencies';
      pkg[group] ??= {};
      pkg[group][m[2]] = m[3];
    }
  }
  // solutions/NPM_SCRIPTS: mỗi dòng "tên-script  lệnh" được gộp vào package.json > scripts (giống người học tự thêm script vào package.json)
  const scriptsFile = join(sol, 'NPM_SCRIPTS');
  if (existsSync(scriptsFile)) {
    for (const line of readFileSync(scriptsFile, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([^\s#]\S*)\s+(.+?)\s*$/.exec(line);
      if (!m) continue;
      pkg.scripts ??= {};
      pkg.scripts[m[1]] = m[2];
    }
  }
  applied.push(id);
}

writeFileSync(join(ref, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
const hash = createHash('sha1').update(JSON.stringify([pkg.dependencies, pkg.devDependencies])).digest('hex');
const hashFile = join(ref, '.pkg-hash');
if (!existsSync(join(ref, 'node_modules')) || !existsSync(hashFile) || readFileSync(hashFile, 'utf8') !== hash) {
  console.error(`== npm install trong ${ref} (lần đầu hoặc khi DEPS thay đổi)`);
  execSync('npm install --no-audit --no-fund', { cwd: ref, stdio: 'inherit' });
  writeFileSync(hashFile, hash);
}
console.error(`== shop-api tham chiếu: ${applied.join(' → ') || '(chỉ base)'}`);
