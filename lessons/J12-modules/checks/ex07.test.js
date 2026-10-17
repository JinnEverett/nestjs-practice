import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = fileURLToPath(new URL('../answers/ex07/', import.meta.url));

test('ex07 · chạy đúng', async () => {
  const { describeUser, describeOrder } = await import('../answers/ex07/index.js');
  assert.equal(describeUser(1), 'USR-1 An có 2 đơn');
  assert.equal(describeOrder(10), 'Đơn 10 của USR-1 An [USR:owner]');
});
test('ex07 · không còn vòng import', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.js'));
  const graph = new Map(
    files.map((f) => {
      const src = readFileSync(path.join(dir, f), 'utf8');
      const deps = [...src.matchAll(/(?:import|export)[^'"]*from\s+['"]\.\/([^'"]+)['"]/g)].map((m) => m[1]);
      return [f, deps];
    }),
  );
  const visit = (node, stack) => {
    if (stack.includes(node)) assert.fail(`vòng import: ${[...stack, node].join(' → ')}`);
    for (const dep of graph.get(node) ?? []) visit(dep, [...stack, node]);
  };
  for (const f of files) visit(f, []);
});
