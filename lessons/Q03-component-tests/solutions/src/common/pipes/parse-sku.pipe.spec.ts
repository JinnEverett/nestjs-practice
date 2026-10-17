import { BadRequestException } from '@nestjs/common';
import { ParseSkuPipe } from './parse-sku.pipe';

describe('ParseSkuPipe', () => {
  const pipe = new ParseSkuPipe();
  const meta = { type: 'param' as const, data: 'sku' };

  it('trim và đổi chữ hoa', () => {
    expect(pipe.transform('  ao-1 ', meta)).toBe('AO-1');
  });

  it('biên độ dài: 3 và 20 hợp lệ; 2 và 21 không', () => {
    expect(pipe.transform('ABC', meta)).toBe('ABC');
    expect(pipe.transform('A'.repeat(20), meta)).toBe('A'.repeat(20));
    expect(() => pipe.transform('AB', meta)).toThrow(BadRequestException);
    expect(() => pipe.transform('A'.repeat(21), meta)).toThrow(BadRequestException);
  });

  it.each(['', '   ', 'a b', 'có-dấu', 'AO_1', 'AO/1'])('từ chối %j', (input) => {
    expect(() => pipe.transform(input, meta)).toThrow(BadRequestException);
  });

  it('thông báo lỗi nêu tên tham số, mặc định "sku" khi không có metadata', () => {
    expect(() => pipe.transform('x', { type: 'param', data: 'maSanPham' })).toThrow(/maSanPham/);
    expect(() => pipe.transform('x')).toThrow(/sku/);
  });

  it('đầu vào không phải chuỗi → BadRequest chứ không ném TypeError', () => {
    expect(() => pipe.transform(undefined as never, meta)).toThrow(BadRequestException);
    expect(() => pipe.transform(12345 as never, meta)).toThrow(BadRequestException);
  });
});
