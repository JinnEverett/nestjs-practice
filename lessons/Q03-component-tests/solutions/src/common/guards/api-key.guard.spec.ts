import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { authConfig } from '../../config/auth.config';
import { ApiKeyGuard } from './api-key.guard';

const contextWith = (headers: Record<string, unknown>): ExecutionContext =>
  ({ switchToHttp: () => ({ getRequest: () => ({ headers }) }) }) as unknown as ExecutionContext;

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  beforeEach(async () => {
    const ref = await Test.createTestingModule({
      providers: [ApiKeyGuard, { provide: authConfig.KEY, useValue: { adminApiKey: 'secret-key-123', accessSecret: 'a', refreshSecret: 'b' } }],
    }).compile();
    guard = ref.get(ApiKeyGuard);
  });

  it('khóa đúng → true', () => {
    expect(guard.canActivate(contextWith({ 'x-api-key': 'secret-key-123' }))).toBe(true);
  });

  it.each([
    ['thiếu header', {}],
    ['khóa sai', { 'x-api-key': 'nope' }],
    ['khác hoa thường', { 'x-api-key': 'SECRET-KEY-123' }],
    ['dài hơn khóa thật', { 'x-api-key': 'secret-key-123x' }],
    ['ngắn hơn khóa thật', { 'x-api-key': 'secret-key-12' }],
    ['rỗng', { 'x-api-key': '' }],
    ['header là mảng (lặp header)', { 'x-api-key': ['secret-key-123', 'secret-key-123'] }],
    ['không phải chuỗi', { 'x-api-key': 12345 }],
  ])('%s → UnauthorizedException', (_name, headers) => {
    expect(() => guard.canActivate(contextWith(headers))).toThrow(UnauthorizedException);
  });

  it('không ném lỗi nào khác UnauthorizedException với khóa rất dài (timingSafeEqual cần cùng độ dài)', () => {
    expect(() => guard.canActivate(contextWith({ 'x-api-key': 'k'.repeat(10_000) }))).toThrow(UnauthorizedException);
  });

  it('khóa lấy từ config chứ không cố định: đổi config thì khóa chấp nhận được đổi', async () => {
    const ref = await Test.createTestingModule({
      providers: [ApiKeyGuard, { provide: authConfig.KEY, useValue: { adminApiKey: 'khac-hoan-toan', accessSecret: 'a', refreshSecret: 'b' } }],
    }).compile();
    const other = ref.get(ApiKeyGuard);
    expect(other.canActivate(contextWith({ 'x-api-key': 'khac-hoan-toan' }))).toBe(true);
    expect(() => other.canActivate(contextWith({ 'x-api-key': 'secret-key-123' }))).toThrow(UnauthorizedException);
  });
});
