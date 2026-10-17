import { satisfies } from './ex01.js';

const GROUPS = ['dependencies', 'devDependencies', 'optionalDependencies'];

export function findDrift(pkg, lock) {
  const rootDeclared = lock.packages?.['']
    ? Object.assign({}, ...GROUPS.map((g) => lock.packages[''][g] ?? {}))
    : {};
  const drift = [];
  for (const group of GROUPS) {
    for (const [name, range] of Object.entries(pkg[group] ?? {})) {
      const locked = lock.packages?.[`node_modules/${name}`]?.version ?? null;
      let reason = null;
      if (locked === null) reason = 'missing';
      else if (!satisfies(locked, range)) reason = 'out-of-range';
      else if (rootDeclared[name] !== range) reason = 'range-mismatch';
      if (reason) drift.push({ name, range, locked, reason });
    }
  }
  return drift.sort((a, b) => a.name.localeCompare(b.name));
}
