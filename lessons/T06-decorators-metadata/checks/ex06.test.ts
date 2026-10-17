import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IsString, IsEmail, Min, Max, IsOptional, validate } from '../answers/ex06.js';

class BaseDto {
  @IsString() name!: unknown;
}
class CreateUserDto extends BaseDto {
  @IsEmail() email!: unknown;
  @Min(18) @Max(120) age!: unknown;
  @IsOptional() @IsString() nickname?: unknown;
}

const make = (data: Record<string, unknown>) => Object.assign(new CreateUserDto(), data);
const pairs = (errs: { property: string; constraint: string; message: string }[]) => errs.map((e) => `${e.property}:${e.constraint}`);

test('ex06 · hợp lệ', () => assert.deepEqual(validate(make({ name: 'An', email: 'a@x.vn', age: 30 })), []));
test('ex06 · gom mọi lỗi, đúng thứ tự', () => {
  const errs = validate(make({ name: 5, email: 'nope', age: 10, nickname: 7 }));
  assert.deepEqual(pairs(errs), ['name:isString', 'email:isEmail', 'age:min', 'nickname:isString']);
  assert.ok(errs.every((e) => e.message.length > 0));
});
test('ex06 · max và optional null', () => {
  assert.deepEqual(pairs(validate(make({ name: 'A', email: 'a@x.vn', age: 200, nickname: null }))), ['age:max']);
});
test('ex06 · min/max với không phải số', () => {
  assert.deepEqual(pairs(validate(make({ name: 'A', email: 'a@x.vn', age: '30' }))), ['age:min', 'age:max']);
});
