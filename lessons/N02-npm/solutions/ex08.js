import { maxSatisfying } from './ex02.js';
import { satisfies } from './ex01.js';

/** 'node_modules/a/node_modules/c' → 'node_modules/a' ; 'node_modules/a' → '' */
const parentDir = (dir) => {
  const i = dir.lastIndexOf('/node_modules/');
  return i === -1 ? '' : dir.slice(0, i);
};
const slot = (dir, name) => (dir === '' ? `node_modules/${name}` : `${dir}/node_modules/${name}`);

export function buildTree(rootDeps, registry) {
  const installed = {};
  const queue = [{ dir: '', deps: rootDeps }];

  while (queue.length > 0) {
    const { dir, deps } = queue.shift();
    for (const name of Object.keys(deps).sort()) {
      const range = deps[name];
      if (!registry[name]) throw new Error(`Package not found: ${name}`);

      // đi từ thư mục của requester ngược lên gốc, tìm nơi đầu tiên đã cài `name`
      let cur = dir;
      let found = null;
      for (;;) {
        const path = slot(cur, name);
        if (path in installed) { found = installed[path]; break; }
        if (cur === '') break;
        cur = parentDir(cur);
      }
      if (found !== null && satisfies(found, range)) continue; // dùng lại

      const version = maxSatisfying(Object.keys(registry[name]), range);
      if (version === null) throw new Error(`No matching version for ${name}@${range}`);
      const path = found !== null ? slot(dir, name) : slot('', name);
      installed[path] = version;
      queue.push({ dir: path, deps: registry[name][version].dependencies ?? {} });
    }
  }
  return installed;
}
