// Sinh dữ liệu bậc thang cho shop-api:  npm run seed -- --scale xs|s|m   (hoặc --orders N cho DB trong DATABASE_URL)
//   xs = 100 đơn · s = 10 000 đơn · m = 1 000 000 đơn  →  DB shop_xs / shop_s / shop_m (cùng máy chủ với DATABASE_URL)
//   --seed S   hạt giống (mặc định 42): cùng hạt giống + cùng N cho ĐÚNG cùng dữ liệu, chạy lại bao nhiêu lần cũng được
//   --yes      bắt buộc với --scale m (≈ 1 triệu đơn, 3 triệu dòng hàng, vài trăm MB đến hơn 1 GB đĩa, vài phút)
// Cách làm: MỘT transaction, toàn bộ bằng INSERT ... SELECT ... FROM generate_series (không vòng lặp ở Node), giá trị "ngẫu nhiên" lấy từ
// băm tất định của chỉ số dòng nên không phụ thuộc thứ tự chạy. Tổng tiền mỗi đơn tuân theo CONTRACT:
// totalAmount = Σ(unitPrice × quantity) + shippingFee − discountAmount.
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../src/database/data-source';
import { loadEnv } from '../src/config/env';

const SCALES = { xs: 100, s: 10_000, m: 1_000_000 } as const;
type Scale = keyof typeof SCALES;

interface Args {
  scale?: Scale;
  orders?: number;
  seed: number;
  yes: boolean;
}

function fail(message: string): never {
  console.error(`seed: ${message}`);
  process.exit(2);
}

function parseArgs(argv: string[]): Args {
  const args: Args = { seed: 42, yes: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = (): string => argv[++i] ?? fail(`${a} cần một giá trị`);
    if (a === '--scale') {
      const v = next();
      if (!(v in SCALES)) fail(`--scale phải là một trong: ${Object.keys(SCALES).join(', ')} (nhận được "${v}")`);
      args.scale = v as Scale;
    } else if (a === '--orders') {
      const n = Number(next());
      if (!Number.isInteger(n) || n < 1 || n > 5_000_000) fail('--orders phải là số nguyên trong 1..5 000 000');
      args.orders = n;
    } else if (a === '--seed') {
      const n = Number(next());
      if (!Number.isInteger(n)) fail('--seed phải là số nguyên');
      args.seed = n;
    } else if (a === '--yes') args.yes = true;
    else fail(`tham số lạ: ${a}`);
  }
  if (args.scale === undefined && args.orders === undefined) fail('cần --scale xs|s|m hoặc --orders N');
  if (args.scale === 'm' && !args.yes) fail('--scale m sinh 1 triệu đơn và tốn nhiều đĩa (kiểm tra dung lượng trống rồi chạy lại với --yes)');
  return args;
}

/** Thay tên database trong URL. */
function withDatabase(url: string, database: string): string {
  const u = new URL(url);
  u.pathname = `/${database}`;
  return u.toString();
}

/** Tạo database nếu chưa có (kết nối tới DB bảo trì `postgres`). */
async function ensureDatabase(url: string, database: string): Promise<void> {
  const admin = new DataSource({ type: 'postgres', url: withDatabase(url, 'postgres') });
  await admin.initialize();
  try {
    const exists = (await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [database])) as unknown[];
    if (exists.length === 0) await admin.query(`CREATE DATABASE "${database.replace(/"/g, '""')}"`);
  } finally {
    await admin.destroy();
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = loadEnv().DATABASE_URL;
  let url = baseUrl;
  if (args.scale !== undefined) {
    const database = `shop_${args.scale}`;
    await ensureDatabase(baseUrl, database);
    url = withDatabase(baseUrl, database);
  }
  const N = args.orders ?? SCALES[args.scale as Scale];
  const U = Math.max(10, Math.floor(N / 10));
  const P = Math.max(50, Math.floor(N / 5));
  const seed = args.seed;

  /** Băm tất định → số nguyên trong [0, mod). */
  const h = (expr: string, salt: string, mod: number | string): string => `(abs(hashtextextended((${expr})::text || '${salt}', ${seed})) % ${mod})`;
  const T0 = `TIMESTAMPTZ '2026-01-01 00:00:00+00'`;
  const T1 = `TIMESTAMPTZ '2025-01-01 00:00:00+00'`;
  const YEAR = 31_536_000;

  const ds = new DataSource(buildDataSourceOptions({ url }));
  await ds.initialize();
  const started = performance.now();
  try {
    await ds.runMigrations(); // DB có thể mới tinh
    await ds.transaction(async (m) => {
      const tables = ((await m.query(`SELECT quote_ident(table_name) AS t FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'migrations'`)) as { t: string }[]).map((r) => r.t);
      await m.query(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`);

      await m.query(`INSERT INTO categories (id, name, slug, parent_id)
        SELECT g, 'Danh mục ' || g, 'danh-muc-' || g, CASE WHEN g > 5 THEN ((g - 6) % 5) + 1 END FROM generate_series(1, 20) g`);

      await m.query(`INSERT INTO users (id, email, display_name, role, created_at)
        SELECT g, 'user' || g || '@example.com', 'Người dùng ' || g, CASE WHEN g % 50 = 0 THEN 'admin' ELSE 'customer' END,
               ${T1} + make_interval(secs => ${h('g', 'ut', YEAR)})
        FROM generate_series(1, ${U}) g`);

      await m.query(`INSERT INTO products (id, category_id, sku, name, brand, price, stock, attributes, is_active, weight_grams, created_at)
        SELECT g, 6 + (g % 15), 'SKU-' || lpad(g::text, 7, '0'), 'Sản phẩm ' || g,
               CASE WHEN g % 7 = 0 THEN NULL ELSE 'Brand' || (g % 7) END,
               10000 + ${h('g', 'price', 1990)} * 1000, ${h('g', 'stock', 500)},
               jsonb_build_object('color', (ARRAY['đen', 'trắng', 'đỏ', 'xanh'])[1 + ${h('g', 'color', 4)}]),
               ${h('g', 'active', 20)} <> 0, 100 + ${h('g', 'w', 5000)},
               ${T1} + make_interval(secs => ${h('g', 'pt', YEAR)})
        FROM generate_series(1, ${P}) g`);

      const tagNames = ['sale', 'new', 'hot', 'eco', 'gift', 'limited', 'vegan', 'bestseller', 'clearance', 'premium'];
      await m.query(`INSERT INTO tags (name) SELECT unnest($1::text[])`, [tagNames]);
      await m.query(`INSERT INTO product_tags (product_id, tag_id)
        SELECT DISTINCT g, 1 + ${h('g::text || k::text', 'tag', tagNames.length)}
        FROM generate_series(1, ${P}) g, generate_series(1, 2) k WHERE ${h('g', 'hastag', 3)} > 0`);

      // Đơn hàng: tổng tiền tạm bằng 0, cập nhật sau khi có các dòng hàng.
      await m.query(`INSERT INTO orders (id, user_id, status, shipping_fee, discount_code, discount_amount, total_amount, created_at, updated_at)
        SELECT o.g, 1 + ${h('o.g', 'user', U)},
               CASE WHEN o.s < 20 THEN 'pending' WHEN o.s < 50 THEN 'paid' WHEN o.s < 70 THEN 'shipped'
                    WHEN o.s < 90 THEN 'delivered' WHEN o.s < 98 THEN 'cancelled' ELSE 'refunded' END,
               0, NULL, 0, 0, o.t, o.t
        FROM (SELECT g, ${h('g', 'status', 100)} AS s, ${T0} + make_interval(secs => ${h('g', 'ot', YEAR)}) AS t FROM generate_series(1, ${N}) g) o`);

      // Mỗi đơn đúng 3 dòng hàng với 3 sản phẩm KHÁC NHAU: p_k = ((a + k·b) mod P) + 1, b < P/2 nên p_0, p_1, p_2 đôi một khác nhau.
      const half = Math.max(1, Math.floor(P / 2) - 1);
      await m.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        SELECT o.g, p.id, 1 + ${h('o.g::text || k::text', 'qty', 4)}, p.price
        FROM (SELECT g, ${h('g', 'pa', P)} AS a, 1 + ${h('g', 'pb', half)} AS b FROM generate_series(1, ${N}) g) o
        CROSS JOIN generate_series(0, 2) k
        JOIN products p ON p.id = 1 + ((o.a + k * o.b) % ${P})`);

      await m.query(`UPDATE orders o SET shipping_fee = t.ship, discount_code = t.code, discount_amount = t.disc, total_amount = t.sub + t.ship - t.disc
        FROM (
          SELECT x.order_id, x.sub, x.code,
                 CASE WHEN x.code = 'FREESHIP' OR x.sub >= 500000 THEN 0 ELSE 30000 END AS ship,
                 CASE WHEN x.code = 'WELCOME10' THEN LEAST(100000, floor(x.sub / 10)) ELSE 0 END AS disc
          FROM (
            SELECT i.order_id, sum(i.unit_price * i.quantity) AS sub,
                   CASE WHEN ${h('i.order_id', 'promo', 20)} = 0 THEN 'FREESHIP'
                        WHEN ${h('i.order_id', 'promo', 20)} < 3 AND sum(i.unit_price * i.quantity) >= 200000 THEN 'WELCOME10' END AS code
            FROM order_items i GROUP BY i.order_id
          ) x
        ) t WHERE o.id = t.order_id`);

      await m.query(`INSERT INTO payments (order_id, method, status, amount, created_at)
        SELECT o.id, (ARRAY['card', 'ewallet', 'bank_transfer', 'cod'])[1 + ${h('o.id', 'pm', 4)}], 'succeeded', o.total_amount, o.created_at + interval '5 minutes'
          FROM orders o WHERE o.status IN ('paid', 'shipped', 'delivered', 'refunded')
        UNION ALL
        SELECT o.id, 'card', 'refunded', o.total_amount, o.created_at + interval '2 days' FROM orders o WHERE o.status = 'refunded'
        UNION ALL
        SELECT o.id, 'card', 'failed', o.total_amount, o.created_at + interval '5 minutes' FROM orders o WHERE o.status = 'cancelled' AND ${h('o.id', 'fail', 2)} = 0`);

      // Sequence của các bảng đã chèn id tường minh phải theo kịp, nếu không INSERT kế tiếp sẽ đụng khóa.
      for (const t of ['categories', 'users', 'products', 'orders']) {
        await m.query(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), (SELECT max(id) FROM ${t}))`);
      }
    });
    await ds.query('ANALYZE'); // thống kê cho planner (ngoài transaction)

    const [c] = (await ds.query(`SELECT
        (SELECT count(*) FROM categories) AS categories, (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM products) AS products,
        (SELECT count(*) FROM orders) AS orders, (SELECT count(*) FROM order_items) AS items, (SELECT count(*) FROM payments) AS payments,
        (SELECT md5(string_agg(id || ':' || user_id || ':' || status || ':' || total_amount, ',' ORDER BY id)) FROM orders) AS checksum`)) as Record<string, string>[];
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    console.log(`seed: ${args.scale ?? 'custom'} orders=${c.orders} users=${c.users} products=${c.products} categories=${c.categories} items=${c.items} payments=${c.payments} seed=${seed} checksum=${c.checksum} time=${seconds}s`);
  } finally {
    await ds.destroy();
  }
}

main().catch((error) => {
  console.error('seed: lỗi', error instanceof Error ? error.message : error);
  process.exit(1);
});
