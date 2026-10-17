import { rmSync, writeFileSync } from 'node:fs';
import { bootWith } from './_cfg';
import { http, repoPath } from './_kit';
import { KEY } from './_fixtures';

const files = ['.env', '.env.test', '.env.test.local'] as const;

async function shipping(env: Record<string, string> = {}) {
  const app = await bootWith(env);
  try {
    const p = await http(app).post('/v1/products').set('x-api-key', KEY).send({ sku: 'EV-1', name: 'x', price: 1000, stock: 5 }).expect(201);
    const o = await http(app).post('/v1/orders').set('x-api-key', KEY).send({ items: [{ productId: p.body.id, quantity: 1 }] }).expect(201);
    return o.body.shippingFee as number;
  } finally {
    await app.close();
  }
}

describe('C09 ex08 · 🔴 file .env theo môi trường và thứ tự ưu tiên', () => {
  afterEach(() => files.forEach((f) => rmSync(repoPath(f), { force: true })));
  afterAll(() => files.forEach((f) => rmSync(repoPath(f), { force: true })));

  it('.env.<NODE_ENV> được nạp khi NODE_ENV khớp', async () => {
    writeFileSync(repoPath('.env.test'), 'SHIPPING_FEE=11111\n');
    expect(await shipping()).toBe(11_111);
  });

  it('.env chung được nạp làm nền', async () => {
    writeFileSync(repoPath('.env'), 'SHIPPING_FEE=22222\n');
    expect(await shipping()).toBe(22_222);
  });

  it('thứ tự: .env.<NODE_ENV>.local > .env.<NODE_ENV> > .env', async () => {
    writeFileSync(repoPath('.env'), 'SHIPPING_FEE=1\nFREE_SHIPPING_THRESHOLD=900000\n');
    writeFileSync(repoPath('.env.test'), 'SHIPPING_FEE=2\n');
    expect(await shipping()).toBe(2);
    writeFileSync(repoPath('.env.test.local'), 'SHIPPING_FEE=3\n');
    expect(await shipping()).toBe(3);
  });

  it('biến môi trường thật luôn thắng mọi file', async () => {
    writeFileSync(repoPath('.env.test.local'), 'SHIPPING_FEE=33333\n');
    writeFileSync(repoPath('.env'), 'SHIPPING_FEE=44444\n');
    expect(await shipping({ SHIPPING_FEE: '55555' })).toBe(55_555);
  });

  it('file .env của môi trường KHÁC không bị nạp', async () => {
    writeFileSync(repoPath('.env.production'), 'SHIPPING_FEE=77777\n');
    try {
      expect(await shipping()).toBe(30_000);
    } finally {
      rmSync(repoPath('.env.production'), { force: true });
    }
  });

  it('file .env sai giá trị cũng làm app không khởi động (kiểm tra áp dụng cho cả giá trị từ file)', async () => {
    writeFileSync(repoPath('.env.test'), 'SHIPPING_FEE=mien-phi\n');
    await expect(shipping()).rejects.toThrow(/SHIPPING_FEE/);
  });
});
