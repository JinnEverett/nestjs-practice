import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './_kit';
import { dataSourceOf, pgErrorCode, rebuildSchema, resetDatabase } from './_db';
import { constraintsOf, describeTable } from './_schema';

describe('B01 ex03 · categories và users', () => {
  let app: INestApplication;
  let ds: DataSource;
  beforeAll(async () => {
    app = await createTestApp();
    ds = dataSourceOf(app);
    await rebuildSchema(app); // chấm trên schema mới tinh, không bị lệch bởi DB còn sót từ lần chạy trước
  });
  beforeEach(async () => {
    await resetDatabase(app);
  });
  afterAll(async () => {
    await app?.close();
  });

  it('categories: cột đúng, slug duy nhất (uq_categories_slug), parent_id cho phép NULL', async () => {
    expect(await describeTable(ds, 'categories')).toEqual({ id: 'integer', parent_id: 'integer?', name: 'varchar(100)', slug: 'varchar(100)' });
    expect((await constraintsOf(ds, 'categories')).uq_categories_slug).toBe('u');
    await ds.query(`INSERT INTO categories (name, slug) VALUES ('Áo', 'ao')`);
    expect(await pgErrorCode(ds.query(`INSERT INTO categories (name, slug) VALUES ('Áo khác', 'ao')`))).toBe('23505');
  });

  it('categories: cây hai tầng, id sinh tự động tăng dần', async () => {
    const [a] = (await ds.query(`INSERT INTO categories (name, slug) VALUES ('Thời trang', 'thoi-trang') RETURNING id`)) as { id: number }[];
    const [b] = (await ds.query(`INSERT INTO categories (parent_id, name, slug) VALUES ($1, 'Áo', 'ao') RETURNING id, parent_id`, [a.id])) as { id: number; parent_id: number }[];
    expect(b.parent_id).toBe(a.id);
    expect(b.id).toBeGreaterThan(a.id);
  });

  it('users: cột đúng, role mặc định customer, created_at timestamptz mặc định bây giờ', async () => {
    expect(await describeTable(ds, 'users')).toEqual({ id: 'integer', email: 'varchar(254)', full_name: 'varchar(120)', role: 'varchar(20)', created_at: 'timestamptz' });
    const [u] = (await ds.query(`INSERT INTO users (email, full_name) VALUES ('an@example.com', 'An') RETURNING *`)) as Record<string, unknown>[];
    expect(u.role).toBe('customer');
    expect(Math.abs(Date.now() - new Date(u.created_at as string).getTime())).toBeLessThan(60_000);
  });

  it('users: email duy nhất (uq_users_email) và LUÔN chữ thường: hoa/thường lẫn lộn bị CHECK từ chối', async () => {
    const c = await constraintsOf(ds, 'users');
    expect(c.uq_users_email).toBe('u');
    expect(c.ck_users_email_lower).toBe('c');
    await ds.query(`INSERT INTO users (email, full_name) VALUES ('an@example.com', 'An')`);
    expect(await pgErrorCode(ds.query(`INSERT INTO users (email, full_name) VALUES ('an@example.com', 'An hai')`))).toBe('23505');
    expect(await pgErrorCode(ds.query(`INSERT INTO users (email, full_name) VALUES ('Binh@Example.com', 'Bình')`))).toBe('23514');
  });

  it('users: role chỉ được là customer hoặc admin (ck_users_role)', async () => {
    expect((await constraintsOf(ds, 'users')).ck_users_role).toBe('c');
    await ds.query(`INSERT INTO users (email, full_name, role) VALUES ('ad@example.com', 'Ad', 'admin')`);
    expect(await pgErrorCode(ds.query(`INSERT INTO users (email, full_name, role) VALUES ('x@example.com', 'X', 'root')`))).toBe('23514');
  });

  it('users: KHÔNG có cột chứa mật khẩu ở bước này (băm mật khẩu thuộc A01)', async () => {
    const cols = Object.keys(await describeTable(ds, 'users'));
    expect(cols.filter((c) => /pass|hash|secret/i.test(c))).toEqual([]);
  });
});
