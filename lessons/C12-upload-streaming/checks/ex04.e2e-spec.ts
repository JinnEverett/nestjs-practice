import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { UPLOAD_DIR } from '../../src/uploads/upload.tokens';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';
import { jpeg, png, sandbox, Sandbox, upload } from './_img';

describe('C12 ex04 · lưu trữ: tên file, thay ảnh, không file mồ côi', () => {
  let sb: Sandbox;
  beforeAll(async () => {
    sb = await sandbox();
  });
  afterAll(async () => {
    await sb.cleanup();
  });

  it('tên client gửi (kể cả ../../) không bao giờ thành tên hay đường dẫn trên đĩa', async () => {
    const p = await createProduct(sb.app);
    for (const filename of ['../../etc/passwd.png', '..\\..\\windows\\evil.png', '%2e%2e/x.png', 'a/b/c.png', 'con.png', 'x'.repeat(300) + '.png']) {
      await upload(sb.app, p.id, png(500), { filename }).expect(201);
    }
    expect(sb.files()).toHaveLength(1);
    expect(sb.files()[0]).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(sb.files()[0]).not.toContain('..');
    expect(existsSync(join(sb.dir, '..', 'etc'))).toBe(false);
  });

  it('thay ảnh: chỉ còn một file cho mỗi sản phẩm, kể cả khi đổi định dạng; nội dung là bản mới', async () => {
    const p = await createProduct(sb.app);
    const before = sb.files().length;
    await upload(sb.app, p.id, png(1000, 1)).expect(201);
    await upload(sb.app, p.id, jpeg(2000, 2)).expect(201);
    expect(sb.files().length).toBe(before + 1);
    const res = await http(sb.app).get(`/v1/products/${p.id}/image`).expect(200);
    expect(res.headers['content-type']).toContain('image/jpeg');
    expect(Number(res.headers['content-length'])).toBe(2000);
  });

  it('upload thất bại (404, 415, 413, 401) không để lại file nào', async () => {
    const p = await createProduct(sb.app);
    const before = sb.files();
    await upload(sb.app, 777777, png()).expect(404);
    await upload(sb.app, p.id, Buffer.from('not an image')).expect(415);
    await upload(sb.app, p.id, png(3 * 1024 * 1024)).expect(413);
    await upload(sb.app, p.id, png(), { key: null }).expect(401);
    expect(sb.files()).toEqual(before);
  });

  it('xóa ảnh xóa luôn file trên đĩa', async () => {
    const p = await createProduct(sb.app);
    await upload(sb.app, p.id, png()).expect(201);
    const withFile = sb.files().length;
    await http(sb.app).delete(`/v1/products/${p.id}/image`).set('x-api-key', 'dev-admin-key').expect(204);
    expect(sb.files().length).toBe(withFile - 1);
  });

  it('UPLOAD_DIR là token DI: mặc định nằm trong thư mục tạm của hệ điều hành, không phải thư mục mã nguồn', async () => {
    const app = await createTestApp();
    try {
      const dir = app.get<string>(UPLOAD_DIR, { strict: false });
      expect(typeof dir).toBe('string');
      expect(dir.startsWith(process.cwd())).toBe(false);
    } finally {
      await app.close();
    }
  });

  it('upload song song nhiều sản phẩm: mỗi sản phẩm đúng một file, nội dung không lẫn', async () => {
    const ps = await Promise.all(Array.from({ length: 8 }, () => createProduct(sb.app)));
    await Promise.all(ps.map((p, i) => upload(sb.app, p.id, png(1000 + i, i + 20)).expect(201)));
    for (const [i, p] of ps.entries()) {
      const res = await http(sb.app).get(`/v1/products/${p.id}/image`).expect(200);
      expect(Number(res.headers['content-length'])).toBe(1000 + i);
    }
  });
});
