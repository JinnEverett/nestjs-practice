import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type QueryDeepPartialEntity, QueryFailedError, Repository } from 'typeorm';
import { DuplicateSkuError } from '../common/errors/domain-errors';
import { ProductEntity } from '../database/entities/product.orm-entity';
import type { Product } from './entities/product.entity';
import type { ProductsRepository } from './products.repository';

const UNIQUE_VIOLATION = '23505';

/** Chuyển dòng DB sang hình dạng API (`Product`): thời gian ISO UTC, tiền là number. */
function toProduct(e: ProductEntity): Product {
  return {
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
}

/**
 * Nếu lỗi là vi phạm UNIQUE của SKU thì đổi thành lỗi domain (409). Kiểm tra "tồn tại chưa" ở service KHÔNG đủ:
 * hai request cùng lúc cùng qua bước kiểm tra, rồi cả hai chèn. Ràng buộc UNIQUE của DB là người phân xử duy nhất.
 */
function rethrowDuplicateSku(error: unknown, sku: string | undefined): never {
  if (error instanceof QueryFailedError && (error.driverError as { code?: string } | undefined)?.code === UNIQUE_VIOLATION) {
    throw new DuplicateSkuError(sku ?? '(không rõ)');
  }
  throw error;
}

@Injectable()
export class TypeOrmProductsRepository implements ProductsRepository {
  constructor(@InjectRepository(ProductEntity) private readonly repo: Repository<ProductEntity>) {}

  async findAll(): Promise<Product[]> {
    return (await this.repo.find({ order: { id: 'ASC' } })).map(toProduct);
  }

  async findById(id: number): Promise<Product | undefined> {
    const row = await this.repo.findOneBy({ id });
    return row ? toProduct(row) : undefined;
  }

  async findBySku(sku: string): Promise<Product | undefined> {
    const row = await this.repo.findOneBy({ sku });
    return row ? toProduct(row) : undefined;
  }

  async insert(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    try {
      return toProduct(await this.repo.save(this.repo.create(data)));
    } catch (error) {
      return rethrowDuplicateSku(error, data.sku);
    }
  }

  async update(id: number, patch: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | undefined> {
    try {
      if (Object.keys(patch).length > 0) {
        const result = await this.repo.update({ id }, patch as QueryDeepPartialEntity<ProductEntity>);
        if (result.affected === 0) return undefined;
      }
      return this.findById(id);
    } catch (error) {
      return rethrowDuplicateSku(error, patch.sku);
    }
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
