// ex08 · Cached / Logging repository — đáp án best practice (Decorator pattern)
//
// - Mỗi decorator implement CÙNG interface và bọc một instance khác → ghép tùy ý, mỗi class một trách nhiệm.
// - Cache lưu { value, expiresAt }, nhớ cả null (chống cache penetration); update ghi kết quả mới vào cache
//   (write-through) thay vì chỉ xóa.
// - Đồng hồ tiêm vào để test TTL.
// Trong NestJS: provider useFactory ghép các lớp lại; hoặc @nestjs/cache-manager cho trường hợp đơn giản (B07).
export interface Product {
  id: number;
  name: string;
  price: number;
}

export interface ProductRepository {
  findById(id: number): Promise<Product | null>;
  update(id: number, patch: Partial<Omit<Product, 'id'>>): Promise<Product>;
}

export class CachedProductRepository implements ProductRepository {
  readonly #cache = new Map<number, { value: Product | null; expiresAt: number }>();

  constructor(
    private readonly inner: ProductRepository,
    private readonly ttlMs: number,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async findById(id: number): Promise<Product | null> {
    const hit = this.#cache.get(id);
    if (hit && this.now() < hit.expiresAt) return hit.value;
    const value = await this.inner.findById(id);
    this.#cache.set(id, { value, expiresAt: this.now() + this.ttlMs });
    return value;
  }

  async update(id: number, patch: Partial<Omit<Product, 'id'>>): Promise<Product> {
    const updated = await this.inner.update(id, patch);
    this.#cache.set(id, { value: updated, expiresAt: this.now() + this.ttlMs });
    return updated;
  }
}

export class LoggingProductRepository implements ProductRepository {
  constructor(
    private readonly inner: ProductRepository,
    private readonly logger: string[],
  ) {}

  findById(id: number): Promise<Product | null> {
    this.logger.push(`findById ${id}`);
    return this.inner.findById(id);
  }

  update(id: number, patch: Partial<Omit<Product, 'id'>>): Promise<Product> {
    this.logger.push(`update ${id}`);
    return this.inner.update(id, patch);
  }
}
