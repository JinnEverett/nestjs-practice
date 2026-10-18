import type { ValueTransformer } from 'typeorm';

/**
 * Driver `pg` trả `numeric` (và `bigint`) dưới dạng **chuỗi** để không mất độ chính xác. Tiền VND trong dự án là số nguyên
 * tối đa 12 chữ số (< 2^53), nên chuyển sang `number` an toàn. Nếu một giá trị vượt ngưỡng an toàn thì **ném lỗi** thay vì
 * âm thầm làm tròn (nhiều hệ thống đã mất tiền vì điều này).
 */
export const moneyTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null): number | null => {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    if (!Number.isSafeInteger(n)) throw new RangeError(`Giá trị tiền không phải số nguyên an toàn: ${value}`);
    return n;
  },
};

/** Giá trị lớn nhất của `numeric(12,0)`. DTO dùng chung hằng này để chặn giá vượt cột ở tầng API (400, không phải 500). */
export const MONEY_MAX = 999_999_999_999;
/** Giá trị lớn nhất của `integer` (int4) trong Postgres. */
export const INT4_MAX = 2_147_483_647;
