import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sum } from '../answers/ex01.js';

test('ex01 · 1 + 2 = 3', () => assert.equal(sum(1, 2), 3));
test('ex01 · số âm', () => assert.equal(sum(-5, 2), -3));
test('ex01 · số 0', () => assert.equal(sum(0, 0), 0));
