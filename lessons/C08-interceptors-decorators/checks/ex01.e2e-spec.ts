import { INestApplication } from '@nestjs/common';
import { createAppWithBoom } from './_boom';
import { http } from './_kit';

describe('C08 ex01 · @ReqId() (createParamDecorator)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createAppWithBoom();
  });
  afterAll(async () => {
    await app.close();
  });

  it('handler nhận đúng id đang gắn trên response', async () => {
    const res = await http(app).get('/boom/rid').expect(200);
    expect(res.body.id).toBe(res.headers['x-request-id']);
  });

  it('id do client gửi (hợp lệ) được truyền vào handler', async () => {
    const res = await http(app).get('/boom/rid').set('X-Request-Id', 'abc-12345-xyz').expect(200);
    expect(res.body).toEqual({ id: 'abc-12345-xyz' });
  });

  it('song song: mỗi request nhận id của chính nó', async () => {
    const ids = Array.from({ length: 15 }, (_, i) => `par-${i}-0123456789`);
    const out = await Promise.all(ids.map((id) => http(app).get('/boom/rid').set('X-Request-Id', id)));
    expect(out.map((r) => r.body.id)).toEqual(ids);
  });
});
