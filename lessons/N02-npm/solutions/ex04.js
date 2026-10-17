import { builtinModules } from 'node:module';

const BUILTINS = new Set(builtinModules.map((m) => m.replace(/^node:/, '').split('/')[0]));
const SPEC_RES = [
  /\bimport\s+(?:[\w*{}\s,$]+?\s+from\s+)?['"]([^'"]+)['"]/g,
  /\bexport\s+(?:[\w*{}\s,$]+?\s+)from\s+['"]([^'"]+)['"]/g,
  /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
];

const packageName = (spec) => {
  if (spec.startsWith('.') || spec.startsWith('/')) return null;
  if (spec.startsWith('node:')) return null;
  const segs = spec.split('/');
  const name = spec.startsWith('@') ? segs.slice(0, 2).join('/') : segs[0];
  return BUILTINS.has(name) ? null : name;
};

const isTestFile = (path) => /^(tests?|e2e)\//.test(path) || /\.(spec|test)\./.test(path);

export function auditImports({ pkg, files }) {
  const declared = (g) => new Set(Object.keys(pkg[g] ?? {}));
  const prod = declared('dependencies');
  const dev = declared('devDependencies');
  const other = new Set([...declared('peerDependencies'), ...declared('optionalDependencies')]);

  const usedAnywhere = new Set();
  const usedInSrc = new Set();
  for (const [path, code] of Object.entries(files)) {
    for (const re of SPEC_RES) {
      for (const m of code.matchAll(re)) {
        const name = packageName(m[1]);
        if (!name) continue;
        usedAnywhere.add(name);
        if (!isTestFile(path)) usedInSrc.add(name);
      }
    }
  }

  const sorted = (set) => [...set].sort();
  return {
    missing: sorted([...usedAnywhere].filter((n) => !prod.has(n) && !dev.has(n) && !other.has(n))),
    unused: sorted([...prod].filter((n) => !usedAnywhere.has(n) && !n.startsWith('@types/'))),
    devInSrc: sorted([...usedInSrc].filter((n) => dev.has(n) && !prod.has(n))),
  };
}
