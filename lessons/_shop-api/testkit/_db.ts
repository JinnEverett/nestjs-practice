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
  await ds.synchronize();
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
