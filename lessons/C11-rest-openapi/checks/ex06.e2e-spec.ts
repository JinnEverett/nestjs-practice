import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

const parse = (header: string | undefined): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const m of (header ?? '').matchAll(/<([^>]+)>;\s*rel="([^"]+)"/g)) out[m[2]] = m[1];
  return out;
};
const q = (url: string) => Object.fromEntries(new URL(url, 'http://x').searchParams);

describe('C11 ex06 · header Link cho phân trang (RFC 8288)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
    for (let i = 0; i < 7; i++) await createProduct(app, { brand: i < 5 ? 'Acme' : 'Zeta' });
  });
  afterAll(async () => {
    await app.close();
  });

  it('trang giữa có first, prev, next, last', async () => {
    const res = await http(app).get('/v1/products?page=2&limit=2').expect(200);
    const links = parse(res.headers.link);
    expect(Object.keys(links).sort()).toEqual(['first', 'last', 'next', 'prev']);
    expect(q(links.first)).toMatchObject({ page: '1', limit: '2' });
    expect(q(links.prev)).toMatchObject({ page: '1' });
    expect(q(links.next)).toMatchObject({ page: '3' });
    expect(q(links.last)).toMatchObject({ page: '4' }); // ceil(7/2)
    expect(links.next.startsWith('/v1/products?')).toBe(true);
  });

  it('trang đầu không có prev; trang cuối không có next', async () => {
    const first = parse((await http(app).get('/v1/products?limit=3')).headers.link);
    expect(Object.keys(first).sort()).toEqual(['first', 'last', 'next']);
    const last = parse((await http(app).get('/v1/products?page=3&limit=3')).headers.link);
    expect(Object.keys(last).sort()).toEqual(['first', 'last', 'prev']);
  });

  it('giữ nguyên các tham số lọc/sắp xếp khác khi đổi trang', async () => {
    const res = await http(app).get('/v1/products?brand=acme&sort=-price&page=2&limit=2').expect(200);
    const links = parse(res.headers.link);
    expect(q(links.next)).toMatchObject({ brand: 'acme', sort: '-price', page: '3', limit: '2' });
    expect(q(links.last)).toMatchObject({ brand: 'acme', page: '3' }); // 5 sản phẩm Acme / 2 = 3 trang
  });

  it('một trang duy nhất: first và last cùng trỏ trang 1, không prev/next; danh sách rỗng vẫn hợp lệ', async () => {
    const one = parse((await http(app).get('/v1/products?limit=100')).headers.link);
    expect(Object.keys(one).sort()).toEqual(['first', 'last']);
    expect(q(one.last).page).toBe('1');
    const empty = await http(app).get('/v1/products?brand=khong-co').expect(200);
    expect(q(parse(empty.headers.link).last).page).toBe('1');
  });

  it('page vượt quá trang cuối: prev không vượt quá last', async () => {
    const res = await http(app).get('/v1/products?page=99&limit=3').expect(200);
    const links = parse(res.headers.link);
    expect(q(links.prev).page).toBe('3');
    expect(links.next).toBeUndefined();
  });

  it('header Link có cả khi phản hồi lấy từ cache (HIT)', async () => {
    const a = await http(app).get('/v1/products?page=2&limit=2&q=san');
    const b = await http(app).get('/v1/products?page=2&limit=2&q=san');
    expect([a.headers['x-cache'], b.headers['x-cache']]).toEqual(['MISS', 'HIT']);
    expect(b.headers.link).toBe(a.headers.link);
    expect(b.headers.link).toBeDefined();
  });

  it('các route không phải danh sách không có Link', async () => {
    expect((await http(app).get('/v1/products/1')).headers.link).toBeUndefined();
    expect((await http(app).get('/ping')).headers.link).toBeUndefined();
  });

  it('(REST có sẵn) điều kiện GET: ETag + If-None-Match → 304 không body', async () => {
    const p = await createProduct(app);
    const first = await http(app).get(`/v1/products/${p.id}`).expect(200);
    const etag = first.headers.etag as string;
    expect(etag).toBeDefined();
    const again = await http(app).get(`/v1/products/${p.id}`).set('If-None-Match', etag).expect(304);
    expect(again.text).toBe('');
  });
});
