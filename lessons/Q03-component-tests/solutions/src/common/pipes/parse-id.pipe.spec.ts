import { BadRequestException } from '@nestjs/common';
import { ParseIdPipe } from './parse-id.pipe';

describe('ParseIdPipe', () => {
  const pipe = new ParseIdPipe();
  const meta = (data = 'id') => ({ type: 'param' as const, data });

  it.each([['1', 1], ['42', 42], ['9007199254740991', 9007199254740991]])('chuỗi %s → số %i', (input, expected) => {
    expect(pipe.transform(input, meta())).toBe(expected);
  });

  it('nhận cả number (ValidationPipe transform đã đổi trước) khi là số nguyên dương an toàn', () => {
    expect(pipe.transform(7, meta())).toBe(7);
  });

  it.each(['0', '-1', '1.5', 'abc', '', ' 1', '1 ', '1e3', '0x10', '007', '+1', '9007199254740993'])('từ chối chuỗi %j', (input) => {
    expect(() => pipe.transform(input, meta())).toThrow(BadRequestException);
  });

  it.each([0, -3, 2.5, NaN, Infinity, 9007199254740993])('từ chối number %p', (input) => {
    expect(() => pipe.transform(input, meta())).toThrow(BadRequestException);
  });

  it('thông báo lỗi nêu tên tham số; mặc định là "id" khi thiếu metadata.data', () => {
    expect(() => pipe.transform('x', meta('orderId'))).toThrow(/orderId/);
    expect(() => pipe.transform('x', { type: 'param' })).toThrow(/id/);
  });
});
