import { Transform, TransformFnParams } from 'class-transformer';

/**
 * `?include=a,b` → `['a', 'b']`; vắng mặt → `[]`. Giá trị lạ để `@IsIn(..., { each: true })` từ chối bằng 400.
 * Chấp nhận cả `?include=a&include=b` (Express trả mảng). Loại phần tử rỗng và trùng lặp.
 */
export const splitInclude = ({ value }: TransformFnParams): unknown => {
  if (value === undefined) return [];
  const parts = (Array.isArray(value) ? value : [value]).flatMap((v) => (typeof v === 'string' ? v.split(',') : [v]));
  return [...new Set(parts.map((p) => (typeof p === 'string' ? p.trim() : p)).filter((p) => p !== ''))];
};

export const IncludeTransform = () => Transform(splitInclude);
