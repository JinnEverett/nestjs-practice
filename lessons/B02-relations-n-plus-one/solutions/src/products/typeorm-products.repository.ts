import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type QueryDeepPartialEntity, QueryFailedError, Repository } from 'typeorm';
import { DuplicateSkuError, InvalidCategoryError } from '../common/errors/domain-errors';
import { ProductEntity } from '../database/entities/product.orm-entity';
import type { Product, ProductInclude } from './entities/product.entity';
import type { ProductsRepository } from './products.repository';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';
const RESTRICT_VIOLATION = '23001'; // ON DELETE RESTRICT dùng mã riêng, KHÁC 23503

const pgCode = (error: unknown): string | undefined =>
  error instanceof QueryFailedError ? (error.driverError as { code?: string } | undefined)?.code : undefined;

/** Chuyển dòng DB sang hình dạng API (`Product`): thời gian ISO UTC, tiền là number. */
function toProduct(e: ProductEntity, include: readonly ProductInclude[] = []): Product {
  const product: Product = {
    id: e.id,
    categoryId: e.categoryId,
    sku: e.sku,
    name: e.name,
    brand: e.brand,
    price: e.price,
    stock: e.stock,
    attributes: e.attributes,
    isActive: e.isActive,
    createdAt: e.createdAt.toISOString(),
  };
  if (include.includes('category') && e.category) product.category = { id: e.category.id, name: e.category.name, slug: e.category.slug };
  if (include.includes('tags')) product.tags = (e.tags ?? []).map((t) => t.name).sort();
  return product;
}

/**
 * Nếu lỗi là vi phạm UNIQUE của SKU thì đổi thành lỗi domain (409). Kiểm tra "tồn tại chưa" ở service KHÔNG đủ:
 * hai request cùng lúc cùng qua bước kiểm tra, rồi cả hai chèn. Ràng buộc UNIQUE của DB là người phân xử duy nhất.
 */
/** Chỉ các CỘT của bảng products (bỏ `category`/`tags` của lớp API): entity ORM không nhận chuỗi nhãn hay tóm tắt danh mục. */
function columnsOf<T extends Partial<Product>>(p: T): Omit<T, 'category' | 'tags'> {
  const { category: _category, tags: _tags, ...columns } = p;
  void _category;
  void _tags;
  return columns;
}

function rethrowWriteError(error: unknown, data: { sku?: string; categoryId?: number }): never {
  const code = pgCode(error);
  if (code === UNIQUE_VIOLATION) throw new DuplicateSkuError(data.sku ?? '(không rõ)');
  // Khóa ngoại fk_products_category: danh mục không tồn tại → 422, không phải 500.
  if (code === FOREIGN_KEY_VIOLATION) throw new InvalidCategoryError(data.categoryId ?? 0);
  throw error;
}

@Injectable()
export class TypeOrmProductsRepository implements ProductsRepository {
  constructor(@InjectRepository(ProductEntity) private readonly repo: Repository<ProductEntity>) {}

  async findAll(): Promise<Product[]> {
    return (await this.repo.find({ order: { id: 'ASC' } })).map((row) => toProduct(row));
  }

  async findById(id: number, include: readonly ProductInclude[] = []): Promise<Product | undefined> {
    // Không include → findOneBy: đúng 1 truy vấn, không JOIN. Có include → relations: TypeORM JOIN trong CÙNG truy vấn.
    const row = include.length === 0
      ? await this.repo.findOneBy({ id })
      : await this.repo.findOne({ where: { id }, relations: { category: include.includes('category'), tags: include.includes('tags') } });
    return row ? toProduct(row, include) : undefined;
  }

  async findBySku(sku: string): Promise<Product | undefined> {
    const row = await this.repo.findOneBy({ sku });
    return row ? toProduct(row) : undefined;
  }

  async insert(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    try {
      return toProduct(await this.repo.save(this.repo.create(columnsOf(data))));
    } catch (error) {
      return rethrowWriteError(error, data);
    }
  }

  async update(id: number, patch: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | undefined> {
    try {
      if (Object.keys(patch).length > 0) {
        const result = await this.repo.update({ id }, columnsOf(patch) as QueryDeepPartialEntity<ProductEntity>);
        if (result.affected === 0) return undefined;
      }
      return this.findById(id);
    } catch (error) {
      return rethrowWriteError(error, patch);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.repo.delete({ id });
      return (result.affected ?? 0) > 0;
    } catch (error) {
      // fk_order_items_product (RESTRICT): sản phẩm đã nằm trong đơn thì không xóa được, lịch sử đơn hàng phải còn nguyên.
      if (pgCode(error) === RESTRICT_VIOLATION || pgCode(error) === FOREIGN_KEY_VIOLATION) throw new ConflictException(`Sản phẩm #${id} đã nằm trong đơn hàng`);
      throw error;
    }
  }
}
