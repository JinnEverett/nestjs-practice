import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../answers/ex02.js';

test('ex02 · bỏ dấu, chữ thường, gạch nối', () => {
  assert.equal(slugify('Áo Thun Nam Đẹp 2026!'), 'ao-thun-nam-dep-2026');
  assert.equal(slugify('Đường đến trường'), 'duong-den-truong');
});
test('ex02 · gộp ký tự lạ liên tiếp, bỏ gạch 2 đầu', () => {
  assert.equal(slugify('  Điện thoại -- Giá rẻ  '), 'dien-thoai-gia-re');
  assert.equal(slugify('--a__b--'), 'a-b');
});
test('ex02 · không còn gì → chuỗi rỗng', () => {
  assert.equal(slugify('!!!'), '');
  assert.equal(slugify(''), '');
});
test('ex02 · đủ bộ dấu', () => assert.equal(slugify('ÀÁẢÃẠ ăằắẳẵặ âầấẩẫậ ÊỆ ƠỚ ƯỨ ỲÝỶỸỴ'), 'aaaaa-aaaaaa-aaaaaa-ee-oo-uu-yyyyy'));
