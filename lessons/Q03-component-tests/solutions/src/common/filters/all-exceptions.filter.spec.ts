import { ArgumentsHost, BadRequestException, ConflictException, ForbiddenException, HttpException, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DuplicateSkuError, OutOfStockError, ProductNotFoundError } from '../errors/domain-errors';
import { ValidationFailedException } from '../errors/validation-failed.exception';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const reply = jest.fn();
  const setHeader = jest.fn();
  const adapter = { getRequestUrl: () => '/v1/products/7?access_token=SECRET', getRequestMethod: () => 'GET', setHeader, reply };
  const filter = new AllExceptionsFilter({ httpAdapter: adapter } as unknown as HttpAdapterHost);
  const host = { switchToHttp: () => ({ getRequest: () => ({}), getResponse: () => ({}) }) } as unknown as ArgumentsHost;
  let logError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => logError.mockRestore());

  const run = (exception: unknown) => {
    filter.catch(exception, host);
    const [, body, status] = reply.mock.calls[0] as [unknown, Record<string, unknown>, number];
    return { body, status };
  };

  it('luôn đặt Content-Type application/problem+json', () => {
    run(new NotFoundException());
    expect(setHeader).toHaveBeenCalledWith(expect.anything(), 'Content-Type', 'application/problem+json');
  });

  it('HttpException 4xx: giữ status, type theo bảng mã, title chuẩn, detail là message gốc', () => {
    const { body, status } = run(new ForbiddenException('không được'));
    expect(status).toBe(403);
    expect(body).toEqual({ type: 'urn:shop:error:forbidden', title: 'Forbidden', status: 403, detail: 'không được', instance: '/v1/products/7' });
  });

  it.each([[400, 'bad-request'], [401, 'unauthorized'], [404, 'not-found'], [408, 'request-timeout'], [409, 'conflict'], [413, 'payload-too-large'], [422, 'unprocessable-entity']])(
    'status %i → type urn:shop:error:%s',
    (status, code) => {
      expect(run(new HttpException('x', status)).body.type).toBe(`urn:shop:error:${code}`);
    },
  );

  it('status không có trong bảng (418) → type …:error', () => {
    expect(run(new HttpException('trà', 418)).body.type).toBe('urn:shop:error:error');
  });

  it('instance không chứa query string', () => {
    expect(run(new NotFoundException()).body.instance).toBe('/v1/products/7');
    expect(JSON.stringify(run(new NotFoundException()).body)).not.toContain('SECRET');
  });

  it('response dạng object có message mảng → nối bằng "; "', () => {
    expect(run(new HttpException({ message: ['a', 'b'] }, 400)).body.detail).toBe('a; b');
  });

  it('lỗi validation có cấu trúc: type validation, errors giữ nguyên', () => {
    const errors = [{ field: 'price', message: 'price must not be less than 0' }];
    const { body, status } = run(new ValidationFailedException(errors));
    expect(status).toBe(400);
    expect(body).toMatchObject({ type: 'urn:shop:error:validation', errors });
  });

  it.each([
    [new ProductNotFoundError(5), 404, 'product-not-found', { productId: 5 }],
    [new OutOfStockError(7, 5, 2), 409, 'out-of-stock', { productId: 7, requested: 5, available: 2 }],
    [new DuplicateSkuError('AO-1'), 409, 'duplicate-sku', { sku: 'AO-1' }],
  ])('lỗi domain %# → status %i, type %s, extension ra gốc phản hồi', (error, status, code, ext) => {
    const out = run(error);
    expect(out.status).toBe(status);
    expect(out.body).toMatchObject({ type: `urn:shop:error:${code}`, detail: error.message, ...ext });
  });

  it('5xx (HttpException): giữ status, ẩn detail gốc, type internal', () => {
    const { body, status } = run(new ServiceUnavailableException('db-internal-7 hết kết nối'));
    expect(status).toBe(503);
    expect(body.type).toBe('urn:shop:error:internal');
    expect(JSON.stringify(body)).not.toContain('db-internal-7');
  });

  it('lỗi lạ (Error, chuỗi, null, undefined) → 500 chung chung, chi tiết chỉ vào log', () => {
    for (const thrown of [new Error('mật khẩu=hunter2'), 'chuỗi-bí-mật', null, undefined]) {
      reply.mockClear();
      logError.mockClear();
      const { body, status } = run(thrown);
      expect(status).toBe(500);
      expect(body.type).toBe('urn:shop:error:internal');
      expect(JSON.stringify(body)).not.toMatch(/hunter2|chuỗi-bí-mật/);
      expect(logError).toHaveBeenCalled();
    }
    expect(logError.mock.calls.flat().join(' ')).toBeDefined();
  });

  it('lỗi 4xx không phải HttpException nhưng có status (kiểu http-errors của body-parser) → dùng status đó', () => {
    const err = Object.assign(new Error('request entity too large'), { status: 413 });
    const { body, status } = run(err);
    expect(status).toBe(413);
    expect(body).toMatchObject({ type: 'urn:shop:error:payload-too-large', detail: 'request entity too large' });
  });

  it('status ngoài 400..599 trên object lạ bị bỏ qua → 500', () => {
    expect(run(Object.assign(new Error('x'), { status: 200 })).status).toBe(500);
  });

  it('log 5xx kèm method + đường dẫn (không query); 4xx không log error', () => {
    run(new Error('x'));
    expect(String(logError.mock.calls[0][0])).toContain('GET /v1/products/7');
    expect(String(logError.mock.calls[0][0])).not.toContain('SECRET');
    logError.mockClear();
    reply.mockClear();
    run(new ConflictException());
    expect(logError).not.toHaveBeenCalled();
    expect(BadRequestException).toBeDefined();
  });
});
