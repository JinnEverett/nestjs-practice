import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './_kit';
import { dataSourceOf, pgErrorCode, rebuildSchema, resetDatabase, userTables } from './_db';
import { constraintsOf, describeTable } from './_schema';

describe('B01 ex04 · orders, order_items, payments', () => {
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

  const newOrder = async (): Promise<number> => {
    const [o] = (await ds.query(`INSERT INTO orders (user_id, total_amount) VALUES (1, 100000) RETURNING id`)) as { id: number }[];
    return o.id;
  };

  it('đủ sáu bảng nghiệp vụ trong schema public', async () => {
    const tables = await userTables(ds);
    for (const t of ['categories', 'order_items', 'orders', 'payments', 'products', 'users']) expect(tables).toContain(t);
  });

  it('orders: cột đúng, mọi số tiền là numeric(12,0), updated_at và created_at là timestamptz', async () => {
    expect(await describeTable(ds, 'orders')).toEqual({
      id: 'integer',
      user_id: 'integer',
      status: 'varchar(20)',
      shipping_fee: 'numeric(12,0)',
      discount_code: 'varchar(40)?',
      discount_amount: 'numeric(12,0)',
      total_amount: 'numeric(12,0)',
      created_at: 'timestamptz',
      updated_at: 'timestamptz',
    });
  });

  it('orders: status mặc định pending, chỉ nhận sáu trạng thái hợp lệ; tiền không âm', async () => {
    const [o] = (await ds.query(`INSERT INTO orders (user_id, total_amount) VALUES (1, 5) RETURNING status, shipping_fee, discount_amount`)) as Record<string, unknown>[];
    expect(o).toEqual({ status: 'pending', shipping_fee: '0', discount_amount: '0' });
    expect(await pgErrorCode(ds.query(`INSERT INTO orders (user_id, status, total_amount) VALUES (1, 'lost', 5)`))).toBe('23514');
    expect(await pgErrorCode(ds.query(`INSERT INTO orders (user_id, total_amount) VALUES (1, -1)`))).toBe('23514');
    expect(await pgErrorCode(ds.query(`INSERT INTO orders (user_id, total_amount, shipping_fee) VALUES (1, 1, -30000)`))).toBe('23514');
  });

  it('order_items: cột đúng; số lượng phải > 0; đơn giá không âm; mỗi sản phẩm một dòng mỗi đơn (UNIQUE order_id + product_id)', async () => {
    expect(await describeTable(ds, 'order_items')).toEqual({ id: 'integer', order_id: 'integer', product_id: 'integer', quantity: 'integer', unit_price: 'numeric(12,0)' });
    const orderId = await newOrder();
    await ds.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, 7, 2, 199000)`, [orderId]);
    expect(await pgErrorCode(ds.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, 8, 0, 1)`, [orderId]))).toBe('23514');
    expect(await pgErrorCode(ds.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, 8, 1, -1)`, [orderId]))).toBe('23514');
    expect(await pgErrorCode(ds.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, 7, 1, 1)`, [orderId]))).toBe('23505');
    await ds.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, 8, 1, 1)`, [orderId]); // sản phẩm khác thì được
  });

  it('payments: cột đúng; method và status chỉ nhận giá trị hợp lệ; một đơn có thể có nhiều lần thanh toán', async () => {
    expect(await describeTable(ds, 'payments')).toEqual({ id: 'integer', order_id: 'integer', method: 'varchar(20)', status: 'varchar(20)', amount: 'numeric(12,0)', created_at: 'timestamptz' });
    const orderId = await newOrder();
    await ds.query(`INSERT INTO payments (order_id, method, status, amount) VALUES ($1, 'card', 'failed', 100000)`, [orderId]);
    await ds.query(`INSERT INTO payments (order_id, method, status, amount) VALUES ($1, 'card', 'succeeded', 100000)`, [orderId]);
    expect(await pgErrorCode(ds.query(`INSERT INTO payments (order_id, method, status, amount) VALUES ($1, 'bitcoin', 'succeeded', 1)`, [orderId]))).toBe('23514');
    expect(await pgErrorCode(ds.query(`INSERT INTO payments (order_id, method, status, amount) VALUES ($1, 'cod', 'pending', 1)`, [orderId]))).toBe('23514');
    expect(await pgErrorCode(ds.query(`INSERT INTO payments (order_id, method, status, amount) VALUES ($1, 'cod', 'succeeded', -1)`, [orderId]))).toBe('23514');
  });

  it('mọi bảng có khóa chính (PK) và mọi ràng buộc đặt tên theo quy ước (không phải tên băm tự sinh)', async () => {
    for (const t of ['products', 'categories', 'users', 'orders', 'order_items', 'payments']) {
      const c = await constraintsOf(ds, t);
      expect({ t, hasPk: Object.values(c).includes('p') }).toEqual({ t, hasPk: true });
      const autoNamed = Object.entries(c).filter(([name, type]) => type !== 'p' && !/^(uq|ck)_[a-z_]+$/.test(name));
      expect({ t, autoNamed }).toEqual({ t, autoNamed: [] });
    }
  });
});
