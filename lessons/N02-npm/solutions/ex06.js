const DEV_TOOLS = new Set([
  'typescript', 'jest', 'ts-jest', 'eslint', 'prettier', 'nodemon', 'supertest', 'vitest', 'ts-node',
  '@nestjs/cli', '@nestjs/testing',
]);

const isFloating = (range) => {
  const r = String(range).trim();
  if (r === '' || r === '*' || r === 'latest' || r === 'x') return true;
  return /^(>=|>)/.test(r) && !r.includes('<');
};
const isUrl = (range) => /^(git\+|git:|github:|https?:)/.test(range) || /^[\w.-]+\/[\w.-]+(#.*)?$/.test(range);

export function lintPackageJson(pkg) {
  const issues = [];
  const deps = pkg.dependencies ?? {};
  const dev = pkg.devDependencies ?? {};

  for (const group of [deps, dev]) {
    for (const [name, range] of Object.entries(group)) {
      if (isFloating(range)) issues.push({ code: 'floating-range', name });
      else if (isUrl(range)) issues.push({ code: 'url-dependency', name });
    }
  }
  for (const name of Object.keys(deps)) {
    if (DEV_TOOLS.has(name) || name.startsWith('@types/')) issues.push({ code: 'tool-in-dependencies', name });
    if (name in dev) issues.push({ code: 'duplicate-dependency', name });
  }
  if (!pkg.engines?.node) issues.push({ code: 'missing-engines' });
  if (pkg.private !== true) issues.push({ code: 'not-private' });
  if (!pkg.scripts?.start && !pkg.scripts?.['start:prod']) issues.push({ code: 'no-start-script' });

  return issues.sort((a, b) => a.code.localeCompare(b.code) || (a.name ?? '').localeCompare(b.name ?? ''));
}
