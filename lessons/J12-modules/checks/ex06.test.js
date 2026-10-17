import { test } from 'node:test';
import assert from 'node:assert/strict';
import { config, get } from '../answers/ex06.js';
import * as again from '../answers/ex06.js';

test('ex06 · config có sẵn ngay sau import (không phải Promise)', () => {
  assert.equal(config.app.name, 'shop-api');
  assert.equal(typeof config.then, 'undefined');
});
test('ex06 · get theo đường dẫn', () => {
  assert.equal(get('db.port'), 5434);
  assert.equal(get('db.pool.max'), 10);
  assert.equal(get('db.missing', 'x'), 'x');
  assert.equal(get('nope.deeper'), undefined);
  assert.equal(get('features.1'), 'reviews');
});
test('ex06 · đóng băng sâu', () => {
  assert.ok(Object.isFrozen(config));
  assert.ok(Object.isFrozen(config.db.pool));
  assert.ok(Object.isFrozen(config.features));
  assert.throws(() => {
    config.db.pool.max = 99;
  }, TypeError);
});
test('ex06 · module là singleton', () => assert.equal(again.config, config));
