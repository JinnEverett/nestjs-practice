import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createTestApp, http, repoPath } from './_kit';
import { createProduct, postOrder } from './_fixtures';

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? sources(p) : p.endsWith('.ts') && !p.endsWith('.spec.ts') ? [p] : [];
  });
}

describe('C04 ex02 · gỡ vòng phụ thuộc, không dùng forwardRef', () => {
  it('không còn forwardRef trong src', () => {
    const bad = sources(repoPath('src')).filter((f) => /\bforwardRef\b/.test(readFileSync(f, 'utf8')));
    expect(bad.map((f) => f.slice(repoPath('src').length))).toEqual([]);
  });

  it('app khởi động và hành vi xóa sản phẩm của C03 ex06 giữ nguyên', async () => {
    const app = await createTestApp();
    try {
      const used = await createProduct(app, { stock: 3 });
      const unused = await createProduct(app);
      expect((await postOrder(app, { items: [{ productId: used.id, quantity: 1 }] })).status).toBe(201);
      await http(app).delete(`/v1/products/${used.id}`).expect(409);
      await http(app).delete(`/v1/products/${unused.id}`).expect(204);
      await http(app).delete('/v1/products/999999').expect(404);
    } finally {
      await app.close();
    }
  });

  it('đơn bị từ chối thì sản phẩm KHÔNG bị coi là đã dùng (vẫn xóa được)', async () => {
    const app = await createTestApp();
    try {
      const p = await createProduct(app, { stock: 1 });
      expect((await postOrder(app, { items: [{ productId: p.id, quantity: 5 }] })).status).toBe(409);
      await http(app).delete(`/v1/products/${p.id}`).expect(204);
    } finally {
      await app.close();
    }
  });
});
