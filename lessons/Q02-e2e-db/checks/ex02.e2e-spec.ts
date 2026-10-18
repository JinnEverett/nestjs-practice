import { INestApplication } from '@nestjs/common';
import { createTestApp, fileExists, http } from './_kit';
import { createProduct, makeProduct } from '../factories';

describe('Q02 ex02 · factory dữ liệu thử', () => {
  it('có test/factories.ts', () => {
    expect(fileExists('test', 'factories.ts')).toBe(true);
  });

  describe('makeProduct', () => {
    it('trả thân hợp lệ cho POST /v1/products: sku khớp ^[A-Z0-9-]{3,20}$, name, price nguyên >= 0', () => {
      const p = makeProduct() as { sku: string; name: string; price: number };
      expect(p.sku).toMatch(/^[A-Z0-9-]{3,20}$/);
      expect(typeof p.name).toBe('string');
      expect(p.name.length).toBeGreaterThan(0);
      expect(Number.isInteger(p.price) && p.price >= 0).toBe(true);
    });

    it('SKU không bao giờ trùng: 5000 lần gọi → 5000 SKU khác nhau, đều hợp lệ', () => {
      const skus = new Set<string>();
      for (let i = 0; i < 5000; i++) {
        const { sku } = makeProduct() as { sku: string };
        expect(sku).toMatch(/^[A-Z0-9-]{3,20}$/);
        skus.add(sku);
      }
      expect(skus.size).toBe(5000);
    });

    it('overrides ghi đè từng trường và không đổi các trường còn lại; mỗi lần gọi trả object mới', () => {
      const a = makeProduct({ price: 5, brand: 'Acme' }) as Record<string, unknown>;
      const b = makeProduct() as Record<string, unknown>;
      expect(a).toMatchObject({ price: 5, brand: 'Acme' });
      expect(a).not.toBe(b);
      expect(b.brand).toBeUndefined();
      expect((makeProduct({ sku: 'FIXED-1' }) as { sku: string }).sku).toBe('FIXED-1');
    });
  });

  describe('createProduct(app, overrides)', () => {
    let app: INestApplication;
    beforeAll(async () => {
      app = await createTestApp();
    });
    afterAll(async () => {
      await app.close();
    });

    it('tạo qua API (đã gửi khóa admin) và trả body đã tạo, có id, sku, price...', async () => {
      const p = await createProduct(app, { price: 4321, stock: 2 });
      expect(Number.isInteger(p.id)).toBe(true);
      expect(p).toMatchObject({ price: 4321, stock: 2, isActive: true });
      expect((await http(app).get(`/v1/products/${p.id}`).expect(200)).body.sku).toBe(p.sku);
    });

    it('tạo 30 sản phẩm liên tiếp và song song không bao giờ đụng SKU', async () => {
      const made = await Promise.all(Array.from({ length: 30 }, () => createProduct(app)));
      expect(new Set(made.map((m) => m.sku)).size).toBe(30);
    });

    it('khi API từ chối thì ném lỗi có nội dung chẩn đoán (status và thân lỗi)', async () => {
      await expect(createProduct(app, { price: -1 })).rejects.toThrow(/400/);
      await expect(createProduct(app, { price: -1 })).rejects.toThrow(/validation|price/i);
    });
  });
});
