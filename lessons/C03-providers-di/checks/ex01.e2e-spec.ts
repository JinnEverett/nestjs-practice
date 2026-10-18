import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { PRODUCTS_REPOSITORY } from '../../src/products/products.repository';
import { createProduct } from './_fixtures';

const fake = {
  id: 7, categoryId: 2, sku: 'FAKE-7', name: 'Hàng giả', brand: null, price: 1000, stock: 3,
  attributes: {}, isActive: true, createdAt: '2026-01-01T00:00:00.000Z',
};

describe('C03 ex01 · repository qua injection token', () => {
  it('token PRODUCTS_REPOSITORY tồn tại và service thật sự đi qua nó', async () => {
    const findById = jest.fn(async (id: number) => (id === 7 ? fake : undefined));
    const app = await createTestApp({
      customize: (b) => b.overrideProvider(PRODUCTS_REPOSITORY).useValue({ findById }),
    });
    try {
      const ok = await http(app).get('/v1/products/7').expect(200);
      expect(ok.body).toEqual(fake);
      await http(app).get('/v1/products/8').expect(404);
      expect(findById).toHaveBeenCalledWith(7);
      expect(findById).toHaveBeenCalledWith(8);
    } finally {
      await app.close();
    }
  });

  it('PATCH/DELETE cũng đi qua repository (service không giữ bản sao riêng)', async () => {
    const store = new Map<number, typeof fake>([[7, { ...fake }]]);
    const repo = {
      findById: async (id: number) => store.get(id),
      findBySku: async () => undefined,
      update: async (id: number, patch: Partial<typeof fake>) => {
        const cur = store.get(id);
        if (!cur) return undefined;
        const next = { ...cur, ...patch };
        store.set(id, next);
        return next;
      },
      delete: async (id: number) => store.delete(id),
    };
    const app = await createTestApp({ customize: (b) => b.overrideProvider(PRODUCTS_REPOSITORY).useValue(repo) });
    try {
      const res = await http(app).patch('/v1/products/7').send({ price: 2000 }).expect(200);
      expect(res.body.price).toBe(2000);
      expect(store.get(7)?.price).toBe(2000);
      await http(app).delete('/v1/products/7').expect(204);
      expect(store.has(7)).toBe(false);
    } finally {
      await app.close();
    }
  });

  it('hành vi mặc định của C02 vẫn đúng với repository in-memory', async () => {
    const app = await createTestApp();
    try {
      const a = await createProduct(app, { sku: 'dup-1' });
      await http(app).post('/v1/products').send({ sku: 'DUP-1', name: 'x', price: 1 }).expect(409);
      const list = await http(app).get('/v1/products?sort=-id').expect(200);
      expect(list.body.data[0].id).toBe(a.id);
      expect(list.body.meta.total).toBe(1);
    } finally {
      await app.close();
    }
  });
});
