import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { double } from '../answers/ex02.js';

type _ret = Expect<Equal<ReturnType<typeof double>, number>>;
// @ts-expect-error — truyền chuỗi phải lỗi kiểu
double('2');
test('ex02 · double', () => assert.equal(double(2), 4));
