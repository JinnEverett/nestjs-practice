import { Logger } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { httpLogger } from './http-logger.middleware';

function request(statusCode: number, opts: { method?: string; url?: string; id?: string } = {}) {
  const req = { method: opts.method ?? 'GET', originalUrl: opts.url ?? '/v1/products?token=SECRET', headers: opts.id ? { 'x-request-id': opts.id } : {} };
  const res = Object.assign(new EventEmitter(), { statusCode });
  const next = jest.fn();
  httpLogger(req as never, res as never, next);
  return { res, next };
}

describe('httpLogger', () => {
  let log: jest.SpyInstance;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;
  beforeEach(() => {
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('gọi next() ngay và chưa ghi log cho tới khi response kết thúc', () => {
    const { next } = request(200);
    expect(next).toHaveBeenCalledTimes(1);
    expect(log).not.toHaveBeenCalled();
  });

  it('ghi đúng một dòng khi "finish": method, path, status, ms, requestId', () => {
    const { res } = request(200, { id: 'req-abc-123456' });
    res.emit('finish');
    expect(log).toHaveBeenCalledTimes(1);
    const line = String(log.mock.calls[0][0]);
    expect(line).toMatch(/^GET \/v1\/products 200 \d+(\.\d+)?ms requestId=req-abc-123456$/);
  });

  it('không ghi query string', () => {
    request(200).res.emit('finish');
    expect(String(log.mock.calls[0][0])).not.toContain('SECRET');
    expect(String(log.mock.calls[0][0])).not.toContain('?');
  });

  it.each([[200, 'log'], [204, 'log'], [301, 'log'], [399, 'log'], [400, 'warn'], [404, 'warn'], [499, 'warn'], [500, 'error'], [503, 'error']])(
    'status %i → mức %s',
    (status, level) => {
      request(status).res.emit('finish');
      const spies = { log, warn, error } as Record<string, jest.SpyInstance>;
      for (const [name, spy] of Object.entries(spies)) expect({ name, calls: spy.mock.calls.length }).toEqual({ name, calls: name === level ? 1 : 0 });
    },
  );

  it('không có request id → ghi "-"', () => {
    request(200, { id: undefined }).res.emit('finish');
    expect(String(log.mock.calls[0][0])).toMatch(/requestId=-$/);
  });
});
