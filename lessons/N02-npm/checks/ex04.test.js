import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditImports } from '../answers/ex04.js';

const pkg = {
  dependencies: { '@nestjs/common': '^12.0.0', express: '^5.0.0', lodash: '^4.17.0', unusedlib: '^1.0.0', '@types/express': '^5.0.0' },
  devDependencies: { jest: '^30.0.0', supertest: '^7.0.0', typescript: '^5.9.0', prettier: '^3.0.0' },
};

test('ex04 · gom specifier từ import/require/export-from/dynamic import', () => {
  const r = auditImports({
    pkg: {},
    files: {
      'src/a.ts': `import { A } from 'alpha';\nimport beta from "beta/sub/path";\nimport * as gamma from 'gamma';\nimport 'side-effect';`,
      'src/b.js': `const d = require('delta');\nconst e = await import('epsilon');\nexport { x } from 'zeta';\nexport * from 'eta';`,
    },
  });
  assert.deepEqual(r.missing, ['alpha', 'beta', 'delta', 'epsilon', 'eta', 'gamma', 'side-effect', 'zeta']);
});
test('ex04 · scoped package lấy 2 đoạn, bỏ đường dẫn con', () => {
  const r = auditImports({ pkg: {}, files: { 'src/a.ts': `import { X } from '@nestjs/common/decorators';\nimport y from '@scope/pkg';` } });
  assert.deepEqual(r.missing, ['@nestjs/common', '@scope/pkg']);
});
test('ex04 · bỏ qua đường dẫn tương đối, node: và built-in', () => {
  const r = auditImports({
    pkg: {},
    files: {
      'src/a.ts': `import a from './a';\nimport b from '../b';\nimport fs from 'node:fs';\nimport path from 'path';\nimport { readFile } from 'fs/promises';\nimport c from '/abs/c';`,
    },
  });
  assert.deepEqual(r.missing, []);
});
test('ex04 · unused: có trong dependencies nhưng không ai import; bỏ qua @types/*', () => {
  const r = auditImports({
    pkg,
    files: { 'src/main.ts': `import { Module } from '@nestjs/common';\nimport express from 'express';\nimport { chunk } from 'lodash/fp';` },
  });
  assert.deepEqual(r.unused, ['unusedlib']);
  assert.deepEqual(r.missing, []);
});
test('ex04 · devInSrc: package dev được import từ file không phải test', () => {
  const r = auditImports({
    pkg,
    files: {
      'src/main.ts': `import { Module } from '@nestjs/common';\nimport express from 'express';\nimport _ from 'lodash';\nimport unusedlib from 'unusedlib';\nimport prettier from 'prettier';`,
      'test/app.e2e-spec.ts': `import request from 'supertest';\nimport { Test } from 'jest';`,
      'src/users/users.service.spec.ts': `import ts from 'typescript';`,
    },
  });
  assert.deepEqual(r.devInSrc, ['prettier']);
  assert.deepEqual(r.missing, []);
  assert.deepEqual(r.unused, []);
});
test('ex04 · package vừa ở dependencies vừa ở devDependencies không bị coi là devInSrc', () => {
  const r = auditImports({
    pkg: { dependencies: { zod: '^3.0.0' }, devDependencies: { zod: '^3.0.0' } },
    files: { 'src/a.ts': `import { z } from 'zod';` },
  });
  assert.deepEqual(r.devInSrc, []);
});
test('ex04 · peer/optional dependency không bị coi là missing', () => {
  const r = auditImports({
    pkg: { peerDependencies: { rxjs: '^7.0.0' }, optionalDependencies: { fsevents: '^2.0.0' } },
    files: { 'src/a.ts': `import { of } from 'rxjs';\nimport fse from 'fsevents';` },
  });
  assert.deepEqual(r.missing, []);
});
test('ex04 · kết quả đã sắp xếp và không trùng', () => {
  const r = auditImports({
    pkg: {},
    files: { 'src/a.ts': `import 'b';\nimport 'a';`, 'src/c.ts': `import 'a';\nconst x = require('b');` },
  });
  assert.deepEqual(r.missing, ['a', 'b']);
});
