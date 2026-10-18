import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProductUsageRegistry } from '../product-usage/product-usage.registry';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PRODUCTS_REPOSITORY, type ProductsRepository } from './products.repository';

export const SORT_FIELDS = ['id', 'price', 'name', 'createdAt', 'stock'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export interface ListQuery {
  page: number;
  limit: number;
  sort: { field: SortField; desc: boolean };
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
}

const SKU_PATTERN = /^[A-Z0-9-]{3,20}$/;

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCTS_REPOSITORY) private readonly repo: ProductsRepository,
    private readonly usage: ProductUsageRegistry,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const sku = normalizeSku(dto.sku);
    assertName(dto.name);
    assertPrice(dto.price);
    if (await this.repo.findBySku(sku)) throw new ConflictException(`SKU ${sku} đã tồn tại`);
    return this.repo.insert({
      categoryId: dto.categoryId ?? 1,
      sku,
      name: dto.name.trim(),
      brand: dto.brand ?? null,
      price: dto.price,
      stock: dto.stock ?? 0,
      attributes: dto.attributes ?? {},
      isActive: dto.isActive ?? true,
    });
  }

  async findAll(query: ListQuery): Promise<{ data: Product[]; meta: { page: number; limit: number; total: number } }> {
    const needle = query.q?.toLowerCase();
    const brand = query.brand?.toLowerCase();
    const filtered = (await this.repo.findAll()).filter(
      (p) =>
        (brand === undefined || p.brand?.toLowerCase() === brand) &&
        (query.minPrice === undefined || p.price >= query.minPrice) &&
        (query.maxPrice === undefined || p.price <= query.maxPrice) &&
        (needle === undefined || p.name.toLowerCase().includes(needle)),
    );
    const { field, desc } = query.sort;
    filtered.sort((a, b) => {
      const x = a[field];
      const y = b[field];
      const cmp = x < y ? -1 : x > y ? 1 : 0;
      return (desc ? -cmp : cmp) || a.id - b.id;
    });
    const start = (query.page - 1) * query.limit;
    return {
      data: filtered.slice(start, start + query.limit),
      meta: { page: query.page, limit: query.limit, total: filtered.length },
    };
  }

  async count(): Promise<number> {
    return (await this.repo.findAll()).length;
  }

  async findOne(id: number): Promise<Product> {
    const p = await this.repo.findById(id);
    if (!p) throw new NotFoundException(`Không có sản phẩm #${id}`);
    return p;
  }

  findById(id: number): Promise<Product | undefined> {
    return this.repo.findById(id);
  }

  async findBySku(sku: string): Promise<Product | undefined> {
    return this.repo.findBySku(sku.trim().toUpperCase());
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    await this.findOne(id);
    const patch: Partial<Omit<Product, 'id' | 'createdAt'>> = {};
    if (dto.sku !== undefined) {
      patch.sku = normalizeSku(dto.sku);
      const other = await this.repo.findBySku(patch.sku);
      if (other && other.id !== id) throw new ConflictException(`SKU ${patch.sku} đã tồn tại`);
    }
    if (dto.name !== undefined) {
      assertName(dto.name);
      patch.name = dto.name.trim();
    }
    if (dto.price !== undefined) {
      assertPrice(dto.price);
      patch.price = dto.price;
    }
    if (dto.categoryId !== undefined) patch.categoryId = dto.categoryId;
    if (dto.brand !== undefined) patch.brand = dto.brand;
    if (dto.stock !== undefined) patch.stock = dto.stock;
    if (dto.attributes !== undefined) patch.attributes = dto.attributes;
    if (dto.isActive !== undefined) patch.isActive = dto.isActive;
    return (await this.repo.update(id, patch)) as Product;
  }

  async adjustStock(id: number, delta: number): Promise<void> {
    const p = await this.findOne(id);
    await this.repo.update(id, { stock: p.stock + delta });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    if (this.usage.isUsed(id)) throw new ConflictException(`Sản phẩm #${id} đã nằm trong đơn hàng`);
    await this.repo.delete(id);
  }
}

function assertName(name: unknown): asserts name is string {
  if (typeof name !== 'string' || name.trim() === '' || name.length > 120) {
    throw new BadRequestException('name phải là chuỗi 1..120 ký tự');
  }
}

function assertPrice(price: unknown): asserts price is number {
  if (typeof price !== 'number' || !Number.isInteger(price) || price < 0) {
    throw new BadRequestException('price phải là số nguyên >= 0');
  }
}

function normalizeSku(raw: unknown): string {
  if (typeof raw !== 'string') throw new BadRequestException('sku phải là chuỗi');
  const sku = raw.trim().toUpperCase();
  if (!SKU_PATTERN.test(sku)) throw new BadRequestException('sku phải khớp ^[A-Z0-9-]{3,20}$');
  return sku;
}
