// Testkit cho check cần Postgres (module có checks/.needs-db). Thêm bởi B01.
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

/** DB test mặc định theo CONTRACT mục 5. Check chạy song song nhiều tiến trình thì mỗi tiến trình đặt DATABASE_URL riêng. */
export const DB_URL = (): string => process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5434/shop_test';

/** `DataSource` của ứng dụng (được @nestjs/typeorm đăng ký toàn cục). */
export const dataSourceOf = (app: INestApplication): DataSource => app.get(DataSource);

/** Tên bảng người dùng của schema `public` (không gồm bảng của TypeORM/migration). */
export async function userTables(ds: DataSource): Promise<string[]> {
  const rows: { table_name: string }[] = await ds.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name NOT IN ('migrations', 'typeorm_metadata')
      ORDER BY table_name`,
  );
  return rows.map((r) => r.table_name);
}

/**
 * Dọn dữ liệu mọi bảng bằng MỘT câu TRUNCATE ... RESTART IDENTITY CASCADE (id về 1). Danh sách bảng lấy động.
 * Chỉ dọn Postgres: trạng thái trong RAM của ứng dụng (cache GET, sổ sản phẩm đã vào đơn...) do ứng dụng mới tạo lại.
 */
export async function resetDatabase(app: INestApplication): Promise<void> {
  const ds = dataSourceOf(app);
  const tables = await userTables(ds);
  if (tables.length === 0) return;
  await ds.query(`TRUNCATE ${tables.map((t) => `"${t.replace(/"/g, '""')}"`).join(', ')} RESTART IDENTITY CASCADE`);
}

/**
 * Xóa MỌI bảng rồi dựng lại schema từ entity hiện tại (`dropDatabase` + `synchronize`). Check schema phải chấm trên schema "mới tinh":
 * `synchronize` KHÔNG đổi tên ràng buộc/chỉ mục đã tồn tại và so khớp theo cột, nên DB còn sót từ lần chạy trước (tên tự sinh `UQ_...`)
 * sẽ lệch khỏi entity mà không báo lỗi.
 */
export async function rebuildSchema(app: INestApplication): Promise<void> {
  const ds = dataSourceOf(app);
  await ds.dropDatabase();
  // Từ B03 schema do migration quản lý (synchronize tắt); trước đó thì dùng synchronize.
  if (ds.migrations.length > 0) await ds.runMigrations();
  else await ds.synchronize();
}

/** Mã SQLSTATE của lỗi Postgres khi `promise` bị từ chối; `undefined` nếu promise thành công. */
export async function pgErrorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    const e = error as { code?: string; driverError?: { code?: string } };
    return e.driverError?.code ?? e.code;
  }
}

/** Đặt biến môi trường trong lúc chạy `fn`, rồi trả về như cũ (kể cả khi `fn` ném lỗi). */
export async function withEnv<T>(vars: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
  const saved = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return await fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

/**
 * Tạo danh mục id=1 ("Chưa phân loại") nếu chưa có, và chỉnh sequence để danh mục tạo sau không đụng id 1.
 * Từ B02 sản phẩm có khóa ngoại tới `categories`, mà `categoryId` mặc định của API là 1 (C02): DB trống thì phải có danh mục 1 trước.
 */
export async function seedDefaultCategory(app: INestApplication): Promise<void> {
  const ds = dataSourceOf(app);
  await ds.query(`INSERT INTO categories (id, name, slug) VALUES (1, 'Chưa phân loại', 'chua-phan-loai') ON CONFLICT (id) DO NOTHING`);
  await ds.query(`SELECT setval(pg_get_serial_sequence('categories', 'id'), GREATEST((SELECT max(id) FROM categories), 1))`);
}

/** `resetDatabase` rồi `seedDefaultCategory`: trạng thái "DB sạch nhưng đủ để tạo sản phẩm". */
export async function resetCatalog(app: INestApplication): Promise<void> {
  await resetDatabase(app);
  await seedDefaultCategory(app);
}

/**
 * Đếm (và trả về) các câu SQL mà `fn` gây ra, bằng cách bọc `pg.Client.prototype.query` (mọi truy vấn của TypeORM đi qua đây).
 * Bỏ qua câu điều khiển transaction (BEGIN/COMMIT/ROLLBACK/SAVEPOINT). Dùng để phát hiện N+1: số truy vấn phải KHÔNG tăng theo số dòng.
 */
export async function countQueries<T>(fn: () => Promise<T>): Promise<{ result: T; queries: string[] }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Client } = require('pg') as { Client: { prototype: { query: (...args: unknown[]) => unknown } } };
  const original = Client.prototype.query;
  const queries: string[] = [];
  Client.prototype.query = function (this: unknown, ...args: unknown[]) {
    const first = args[0];
    const text = typeof first === 'string' ? first : (first as { text?: string } | undefined)?.text;
    if (typeof text === 'string' && !/^\s*(BEGIN|COMMIT|ROLLBACK|START TRANSACTION|SAVEPOINT|RELEASE)/i.test(text)) queries.push(text);
    return original.apply(this, args);
  };
  try {
    return { result: await fn(), queries };
  } finally {
    Client.prototype.query = original;
  }
}

/**
 * Xóa sạch mọi thứ trong schema `public` bằng kết nối riêng (TRƯỚC khi dựng ứng dụng). Check của module thay đổi schema phải bắt đầu từ DB
 * trống: nếu DB còn dữ liệu của module trước, việc thêm khóa ngoại/ràng buộc bằng `synchronize` có thể thất bại ngay lúc khởi động
 * (vd. sản phẩm có category_id = 1 nhưng chưa có danh mục nào), và ứng dụng không dậy được.
 */
export async function freshDatabase(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Client } = require('pg') as { Client: new (o: { connectionString: string }) => { connect(): Promise<void>; query(q: string): Promise<unknown>; end(): Promise<void> } };
  const client = new Client({ connectionString: DB_URL() });
  await client.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
  } finally {
    await client.end();
  }
}
