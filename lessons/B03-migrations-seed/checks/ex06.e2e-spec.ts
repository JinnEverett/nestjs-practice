import { DataSource } from 'typeorm';
import { freshDatabase } from './_db';
import { npmRun, openProjectDataSource, one } from './_b03';

jest.setTimeout(240_000);

const checksumOf = (out: string): string => /checksum=([0-9a-f]{32})/.exec(out)?.[1] ?? '';

describe('B03 ex06 · Seed bậc thang: tất định, đủ ràng buộc, chạy lại được', () => {
  let ds: DataSource;
  let firstChecksum = '';
  beforeAll(async () => {
    await freshDatabase();
    ds = await openProjectDataSource();
    await ds.runMigrations();
  });
  afterAll(async () => {
    await ds?.destroy();
  });

  it('`npm run seed -- --orders 300` sinh đúng số dòng: 300 đơn, 30 người dùng, 60 sản phẩm, 20 danh mục (5 gốc + 15 con), 900 dòng hàng', async () => {
    const r = npmRun('seed', ['--orders', '300']);
    expect({ status: r.status, out: r.out.slice(-400) }).toMatchObject({ status: 0 });
    firstChecksum = checksumOf(r.out);
    expect(firstChecksum).toMatch(/^[0-9a-f]{32}$/);
    const c = await one<Record<string, number>>(
      ds,
      `SELECT (SELECT count(*) FROM orders)::int AS orders, (SELECT count(*) FROM users)::int AS users, (SELECT count(*) FROM products)::int AS products,
              (SELECT count(*) FROM categories)::int AS categories, (SELECT count(*) FROM categories WHERE parent_id IS NULL)::int AS roots, (SELECT count(*) FROM order_items)::int AS items`,
    );
    expect(c).toEqual({ orders: 300, users: 30, products: 60, categories: 20, roots: 5, items: 900 });
  });

  it('tính nhất quán: mọi đơn có tổng = Σ(đơn giá × số lượng) + phí ship − giảm giá; mỗi đơn đúng 3 dòng hàng với 3 sản phẩm khác nhau', async () => {
    const bad = await one<{ n: number }>(
      ds,
      `SELECT count(*)::int AS n FROM orders o JOIN (SELECT order_id, sum(unit_price * quantity) AS sub, count(*) AS lines, count(DISTINCT product_id) AS distinct_products FROM order_items GROUP BY order_id) x ON x.order_id = o.id
        WHERE o.total_amount <> x.sub + o.shipping_fee - o.discount_amount OR x.lines <> 3 OR x.distinct_products <> 3`,
    );
    expect(bad.n).toBe(0);
    expect((await one<{ n: number }>(ds, `SELECT count(*)::int AS n FROM orders o WHERE NOT EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id)`)).n).toBe(0);
  });

  it('quy tắc giá (CONTRACT): phí ship 30000 và miễn khi tiền hàng ≥ 500000 hoặc mã FREESHIP; WELCOME10 chỉ khi tiền hàng ≥ 200000, giảm min(100000, 10%)', async () => {
    const rows = (await ds.query(
      `SELECT o.id, o.shipping_fee::int AS ship, o.discount_code AS code, o.discount_amount::int AS disc, x.sub::int AS sub
         FROM orders o JOIN (SELECT order_id, sum(unit_price * quantity) AS sub FROM order_items GROUP BY order_id) x ON x.order_id = o.id`,
    )) as { id: number; ship: number; code: string | null; disc: number; sub: number }[];
    const violations: string[] = [];
    for (const r of rows) {
      const wantShip = r.code === 'FREESHIP' || r.sub >= 500_000 ? 0 : 30_000;
      if (r.ship !== wantShip) violations.push(`#${r.id}: ship ${r.ship} ≠ ${wantShip}`);
      if (r.code === 'WELCOME10') {
        if (r.sub < 200_000) violations.push(`#${r.id}: WELCOME10 với tiền hàng ${r.sub}`);
        if (r.disc !== Math.min(100_000, Math.floor(r.sub / 10))) violations.push(`#${r.id}: giảm ${r.disc}`);
      } else if (r.disc !== 0) violations.push(`#${r.id}: giảm ${r.disc} không có mã WELCOME10`);
    }
    expect(violations).toEqual([]);
    expect(rows.some((r) => r.code === 'WELCOME10')).toBe(true);
    expect(rows.some((r) => r.code === 'FREESHIP')).toBe(true);
  });

  it('thanh toán: chỉ đơn paid/shipped/delivered/refunded có thanh toán thành công đúng bằng tổng; đơn refunded có thêm một khoản refunded; pending không có', async () => {
    const q = async (sql: string): Promise<number> => (await one<{ n: number }>(ds, sql)).n;
    expect(await q(`SELECT count(*)::int AS n FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.status = 'succeeded' AND (o.status NOT IN ('paid','shipped','delivered','refunded') OR p.amount <> o.total_amount)`)).toBe(0);
    expect(await q(`SELECT count(*)::int AS n FROM orders o WHERE o.status IN ('paid','shipped','delivered','refunded') AND (SELECT count(*) FROM payments p WHERE p.order_id = o.id AND p.status = 'succeeded') <> 1`)).toBe(0);
    expect(await q(`SELECT count(*)::int AS n FROM orders o WHERE o.status = 'refunded' AND (SELECT count(*) FROM payments p WHERE p.order_id = o.id AND p.status = 'refunded') <> 1`)).toBe(0);
    expect(await q(`SELECT count(*)::int AS n FROM payments p JOIN orders o ON o.id = p.order_id WHERE o.status = 'pending'`)).toBe(0);
    const statuses = ((await ds.query('SELECT DISTINCT status FROM orders ORDER BY status')) as { status: string }[]).map((r) => r.status);
    expect(statuses).toEqual(expect.arrayContaining(['pending', 'paid', 'shipped', 'delivered']));
  });

  it('chạy lại cùng tham số cho CHÍNH XÁC cùng dữ liệu (checksum) và không nhân đôi dòng; sequence theo kịp (chèn tiếp không đụng khóa)', async () => {
    const again = npmRun('seed', ['--orders', '300']);
    expect(again.status).toBe(0);
    expect(checksumOf(again.out)).toBe(firstChecksum);
    expect((await one<{ n: number }>(ds, 'SELECT count(*)::int AS n FROM orders')).n).toBe(300);
    await ds.query(`INSERT INTO users (email, display_name) VALUES ('after-seed@x.com', 'Sau seed')`);
    await ds.query(`INSERT INTO orders (user_id, total_amount) VALUES (1, 1)`);
    await ds.query(`INSERT INTO products (sku, name, price) VALUES ('AFTER-SEED', 'x', 1)`);
  });

  it('hạt giống khác (--seed 7) cho dữ liệu khác nhưng vẫn đủ số dòng và nhất quán', async () => {
    const r = npmRun('seed', ['--orders', '300', '--seed', '7']);
    expect(r.status).toBe(0);
    expect(checksumOf(r.out)).not.toBe(firstChecksum);
    expect((await one<{ n: number }>(ds, 'SELECT count(*)::int AS n FROM order_items')).n).toBe(900);
  });

  it('tham số sai: --scale lạ, thiếu tham số, --orders không hợp lệ đều thoát với mã khác 0 và có thông báo; --scale m không kèm --yes bị từ chối', () => {
    for (const args of [['--scale', 'xl'], [], ['--orders', 'abc'], ['--orders', '0'], ['--scale', 'm'], ['--bogus']]) {
      const r = npmRun('seed', args);
      expect({ args, failed: r.status !== 0, hasMessage: /seed:/i.test(r.out) }).toEqual({ args, failed: true, hasMessage: true });
    }
  });

  it('`--scale xs` sinh DB shop_xs với đúng 100 đơn, 10 người dùng, 50 sản phẩm', async () => {
    const r = npmRun('seed', ['--scale', 'xs']);
    expect({ status: r.status, out: r.out.slice(-300) }).toMatchObject({ status: 0 });
    const xs = new DataSource({ type: 'postgres', url: new URL('/shop_xs', process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5434/shop_test').toString() });
    await xs.initialize();
    try {
      expect(await one(xs, `SELECT (SELECT count(*) FROM orders)::int AS orders, (SELECT count(*) FROM users)::int AS users, (SELECT count(*) FROM products)::int AS products, (SELECT count(*) FROM order_items)::int AS items`)).toEqual({ orders: 100, users: 10, products: 50, items: 300 });
    } finally {
      await xs.destroy();
    }
  });
});
