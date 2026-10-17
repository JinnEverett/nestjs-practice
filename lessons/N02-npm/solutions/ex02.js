import { satisfies } from './ex01.js';

const parts = (v) => v.split('.').map(Number);

export function compareVersions(a, b) {
  const [pa, pb] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

export function sortVersions(list) {
  return [...list].sort(compareVersions);
}

export function maxSatisfying(list, range) {
  const ok = list.filter((v) => satisfies(v, range));
  return ok.length === 0 ? null : sortVersions(ok).at(-1);
}
