import { RequestIdMiddleware } from './request-id.middleware';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function run(incoming?: unknown) {
  const req = { headers: incoming === undefined ? {} : { 'x-request-id': incoming } } as { headers: Record<string, unknown> };
  const res = { setHeader: jest.fn() };
  const next = jest.fn();
  new RequestIdMiddleware().use(req as never, res as never, next);
  return { req, res, next, id: (res.setHeader.mock.calls[0] as [string, string])[1] };
}

describe('RequestIdMiddleware', () => {
  it('không có id từ client → sinh UUID, đặt header X-Request-Id và req.headers, rồi gọi next đúng 1 lần', () => {
    const { req, res, next, id } = run();
    expect(id).toMatch(UUID);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', id);
    expect(req.headers['x-request-id']).toBe(id);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each(['abcdefgh', 'client-req_12345.abc', 'A'.repeat(64)])('dùng lại id sạch %s', (value) => {
    expect(run(value).id).toBe(value);
  });

  it.each(['abc', 'A'.repeat(65), 'có dấu rất rõ ràng', 'has space inside', '<script>alert(1)</script>', 'id\r\nSet-Cookie: x=1', ''])(
    'thay id không sạch %j bằng UUID mới',
    (value) => {
      const { id, req } = run(value);
      expect(id).toMatch(UUID);
      expect(req.headers['x-request-id']).toBe(id);
    },
  );

  it('header lặp (mảng) không được tin', () => {
    expect(run(['aaaaaaaa-1', 'bbbbbbbb-2']).id).toMatch(UUID);
  });

  it('mỗi request một id khác nhau', () => {
    expect(run().id).not.toBe(run().id);
  });
});
