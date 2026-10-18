// Helper dùng chung cho các check B01 đọc schema thật từ information_schema (không phụ thuộc cách người học viết entity).
import { DataSource } from 'typeorm';

export interface ColumnInfo {
  type: string; // information_schema.data_type, vd 'integer', 'character varying', 'numeric', 'jsonb', 'timestamp with time zone'
  length: number | null;
  precision: number | null;
  scale: number | null;
  nullable: boolean;
  default: string | null;
}

export async function columnsOf(ds: DataSource, table: string): Promise<Record<string, ColumnInfo>> {
  const rows: {
    column_name: string;
    data_type: string;
    character_maximum_length: number | null;
    numeric_precision: number | null;
    numeric_scale: number | null;
    is_nullable: string;
    column_default: string | null;
  }[] = await ds.query(
    `SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale, is_nullable, column_default
       FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
    [table],
  );
  return Object.fromEntries(
    rows.map((r) => [
      r.column_name,
      {
        type: r.data_type,
        length: r.character_maximum_length,
        precision: r.numeric_precision,
        scale: r.numeric_scale,
        nullable: r.is_nullable === 'YES',
        default: r.column_default,
      } satisfies ColumnInfo,
    ]),
  );
}

/** Mô tả cột gọn để so sánh: 'integer', 'varchar(20)', 'numeric(12,0)', 'jsonb', 'timestamptz'; thêm '?' nếu cho phép NULL. */
export function describe_(c: ColumnInfo): string {
  const base =
    c.type === 'character varying'
      ? `varchar(${c.length})`
      : c.type === 'numeric'
        ? `numeric(${c.precision},${c.scale})`
        : c.type === 'timestamp with time zone'
          ? 'timestamptz'
          : c.type;
  return c.nullable ? `${base}?` : base;
}

export async function describeTable(ds: DataSource, table: string): Promise<Record<string, string>> {
  const cols = await columnsOf(ds, table);
  return Object.fromEntries(Object.entries(cols).map(([k, v]) => [k, describe_(v)]));
}

/**
 * Tên ràng buộc (PK/UNIQUE/CHECK/FK) của bảng. Bỏ qua loại 'n' (NOT NULL): từ Postgres 18 mỗi cột NOT NULL cũng có một dòng
 * trong pg_constraint (tên tự sinh kiểu products_sku_not_null), không phải ràng buộc do người học đặt tên.
 */
export async function constraintsOf(ds: DataSource, table: string): Promise<Record<string, string>> {
  const rows: { conname: string; contype: string }[] = await ds.query(
    `SELECT c.conname, c.contype FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = $1 AND c.contype <> 'n'`,
    [table],
  );
  return Object.fromEntries(rows.map((r) => [r.conname, r.contype])); // p = PK, u = unique, c = check, f = FK
}
