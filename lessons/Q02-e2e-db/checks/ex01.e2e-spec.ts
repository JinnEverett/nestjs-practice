import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { readFileSync } from 'node:fs';
import { createTestApp, fileExists, repoPath } from './_kit';
import { cleanDatabase } from '../support/clean-db';
import { createProduct as makeViaApi } from './_fixtures';

describe('Q02 ex01 · cleanDatabase(app)', () => {
  let app: INestApplication;
  let ds: DataSource;
  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await ds.query(`DROP TABLE IF EXISTS "Q02_MixedCase", q02_child, q02_probe, migrations CASCADE`);
    await ds.query(`CREATE TABLE q02_probe (id serial PRIMARY KEY, note text)`);
    await ds.query(`CREATE TABLE "Q02_MixedCase" (id serial PRIMARY KEY, note text)`);
    await ds.query(`CREATE TABLE migrations (id serial PRIMARY KEY, name text)`);
  });
  afterAll(async () => {
    await ds.query(`DROP TABLE IF EXISTS "Q02_MixedCase", q02_child, q02_probe, migrations CASCADE`);
    await app.close();
  });
  const count = async (table: string): Promise<number> => Number((await ds.query(`SELECT count(*)::int AS n FROM ${table}`))[0].n);

  it('có test/support/clean-db.ts', () => {
    expect(fileExists('test', 'support', 'clean-db.ts')).toBe(true);
  });

  it('xóa sạch mọi bảng dữ liệu, kể cả bảng tạm thêm vào sau (danh sách bảng lấy động, không gõ tay)', async () => {
    const p = await makeViaApi(app);
    await ds.query(`INSERT INTO q02_probe(note) VALUES ('a'), ('b')`);
    await ds.query(`INSERT INTO "Q02_MixedCase"(note) VALUES ('x')`);
    expect(await count('products')).toBeGreaterThan(0);
    await cleanDatabase(app);
    expect(await count('products')).toBe(0);
    expect(await count('q02_probe')).toBe(0);
    expect(await count('"Q02_MixedCase"')).toBe(0); // tên có chữ hoa phải được trích dẫn đúng
    expect(p.id).toBeGreaterThan(0);
  });

  it('RESTART IDENTITY: sản phẩm tạo sau khi dọn có id = 1 và serial của bảng khác cũng về 1', async () => {
    await makeViaApi(app);
    await makeViaApi(app);
    await ds.query(`INSERT INTO q02_probe(note) VALUES ('a')`);
    await cleanDatabase(app);
    expect((await makeViaApi(app)).id).toBe(1);
    await ds.query(`INSERT INTO q02_probe(note) VALUES ('again')`);
    expect((await ds.query(`SELECT id FROM q02_probe`))[0].id).toBe(1);
  });

  it('xử lý khóa ngoại (CASCADE): bảng con tham chiếu products không làm câu lệnh lỗi', async () => {
    const p = await makeViaApi(app);
    await ds.query(`CREATE TABLE q02_child (id serial PRIMARY KEY, product_id int REFERENCES products(id))`);
    await ds.query(`INSERT INTO q02_child(product_id) VALUES (${p.id})`);
    await expect(cleanDatabase(app)).resolves.toBeUndefined();
    expect(await count('q02_child')).toBe(0);
    expect(await count('products')).toBe(0);
  });

  it('KHÔNG đụng vào bảng của công cụ (migrations)', async () => {
    await ds.query(`INSERT INTO migrations(name) VALUES ('Init1700000000000')`);
    await cleanDatabase(app);
    expect(await count('migrations')).toBe(1);
  });

  it('gọi lại nhiều lần và gọi song song không lỗi (idempotent)', async () => {
    await cleanDatabase(app);
    await cleanDatabase(app);
    await Promise.all([cleanDatabase(app), cleanDatabase(app)].map((p) => p.catch((e) => e)));
    await cleanDatabase(app);
    expect(await count('products')).toBe(0);
  });

  it('một câu lệnh TRUNCATE cho mọi bảng (không lặp DELETE từng bảng)', () => {
    const src = readFileSync(repoPath('test', 'support', 'clean-db.ts'), 'utf8');
    expect(src).toMatch(/TRUNCATE/i);
    expect(src).toMatch(/RESTART IDENTITY/i);
    expect(src).toMatch(/CASCADE/i);
  });
});
