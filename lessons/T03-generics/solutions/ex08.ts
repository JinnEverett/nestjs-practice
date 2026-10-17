// ex08 · query builder — đáp án best practice
//
// - Builder bất biến: state là object chỉ đọc; mỗi method trả builder MỚI với state đã copy → có thể dựng
//   "query gốc" rồi rẽ nhánh mà không ảnh hưởng nhau.
// - `where<K extends keyof T>(key: K, value: T[K])`: kiểu value phụ thuộc key — chính là kiểu của TypeORM
//   FindOptionsWhere<T>.
// - run: lọc → sắp → offset → limit, đúng thứ tự logic của SQL (WHERE → ORDER BY → OFFSET → LIMIT).
interface State<T> {
  readonly filters: readonly ((row: T) => boolean)[];
  readonly order?: { key: keyof T; dir: 'asc' | 'desc' };
  readonly limit?: number;
  readonly offset: number;
}

const compare = (a: unknown, b: unknown): number => (a === b ? 0 : (a as number | string) < (b as number | string) ? -1 : 1);

class QueryBuilder<T> {
  constructor(private readonly state: State<T>) {}

  where<K extends keyof T>(key: K, value: T[K]): QueryBuilder<T> {
    return new QueryBuilder({ ...this.state, filters: [...this.state.filters, (row) => row[key] === value] });
  }

  whereIn<K extends keyof T>(key: K, values: readonly T[K][]): QueryBuilder<T> {
    const set = new Set(values);
    return new QueryBuilder({ ...this.state, filters: [...this.state.filters, (row) => set.has(row[key])] });
  }

  orderBy(key: keyof T, dir: 'asc' | 'desc' = 'asc'): QueryBuilder<T> {
    return new QueryBuilder({ ...this.state, order: { key, dir } });
  }

  limit(n: number): QueryBuilder<T> {
    return new QueryBuilder({ ...this.state, limit: n });
  }

  offset(n: number): QueryBuilder<T> {
    return new QueryBuilder({ ...this.state, offset: n });
  }

  run(rows: readonly T[]): T[] {
    const { filters, order, offset, limit } = this.state;
    let result = rows.filter((row) => filters.every((f) => f(row)));
    if (order) {
      const sign = order.dir === 'asc' ? 1 : -1;
      result = result.toSorted((a, b) => compare(a[order.key], b[order.key]) * sign);
    }
    return result.slice(offset, limit === undefined ? undefined : offset + limit);
  }
}

export function query<T>(): QueryBuilder<T> {
  return new QueryBuilder<T>({ filters: [], offset: 0 });
}
