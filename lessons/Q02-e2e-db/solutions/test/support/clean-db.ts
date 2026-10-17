import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

/** Bảng của công cụ (migration, metadata): không bao giờ xóa dữ liệu. */
const KEEP = new Set(['migrations', 'typeorm_metadata']);

/**
 * Đưa DB về trạng thái sạch trước mỗi test: TRUNCATE mọi bảng của schema public trong MỘT câu lệnh.
 *  - lấy danh sách bảng từ catalog (không gõ tay: thêm entity mới không phải sửa helper);
 *  - trích dẫn định danh (tên bảng có chữ hoa/ký tự lạ);
 *  - RESTART IDENTITY: id bắt đầu lại từ 1; CASCADE: xử lý khóa ngoại trong một lần.
 */
export async function cleanDatabase(app: INestApplication): Promise<void> {
  const ds = app.get(DataSource);
  const rows: { tablename: string }[] = await ds.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
  const tables = rows.map((r) => r.tablename).filter((t) => !KEEP.has(t));
  if (tables.length === 0) return;
  const list = tables.map((t) => `"${t.replace(/"/g, '""')}"`).join(', ');
  await ds.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}
