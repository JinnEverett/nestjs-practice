import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

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
  private readonly items = new Map<number, Product>();
  private nextId = 1;

  create(dto: CreateProductDto): Product {
    const sku = normalizeSku(dto.sku);
    if (typeof dto.name !== 'string' || dto.name.trim() === '' || dto.name.length > 120) {
      throw new BadRequestException('name phải là chuỗi 1..120 ký tự');
    }
    if (!Number.isInteger(dto.price) || dto.price < 0) throw new BadRequestException('price phải là số nguyên >= 0');
    if (this.findBySku(sku)) throw new ConflictException(`SKU ${sku} đã tồn tại`);
    const product: Product = {
      id: this.nextId++,
      categoryId: dto.categoryId ?? 1,
      sku,
      name: dto.name.trim(),
      brand: dto.brand ?? null,
      price: dto.price,
      stock: dto.stock ?? 0,
      attributes: dto.attributes ?? {},
      isActive: dto.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    this.items.set(product.id, product);
    return { ...product };
  }

  findAll(query: ListQuery): { data: Product[]; meta: { page: number; limit: number; total: number } } {
    const needle = query.q?.toLowerCase();
    const brand = query.brand?.toLowerCase();
    const filtered = [...this.items.values()].filter(
      (p) =>
        (brand === undefined || p.brand?.toLowerCase() === brand) &&
        (query.minPrice === undefined || p.price >= query.minPrice) &&
        (query.maxPrice === undefined || p.price <= query.maxPrice) &&
        (needle === undefined || p.name.toLowerCase().includes(needle)),
    );
    const { field, desc } = query.sort;
    // Sắp xếp trên bản sao ([...values()] đã là mảng mới); hòa thì phân xử bằng id để phân trang ổn định.
    filtered.sort((a, b) => {
      const x = a[field];
      const y = b[field];
      const cmp = x < y ? -1 : x > y ? 1 : 0;
      return (desc ? -cmp : cmp) || a.id - b.id;
    });
    const start = (query.page - 1) * query.limit;
    return {
      data: filtered.slice(start, start + query.limit).map((p) => ({ ...p })),
      meta: { page: query.page, limit: query.limit, total: filtered.length },
    };
  }

  count(): number {
    return this.items.size;
  }

  findOne(id: number): Product {
    const p = this.items.get(id);
    if (!p) throw new NotFoundException(`Không có sản phẩm #${id}`);
    return { ...p };
  }

  findBySku(sku: string): Product | undefined {
    const key = sku.trim().toUpperCase();
    for (const p of this.items.values()) if (p.sku === key) return { ...p };
    return undefined;
  }

  update(id: number, dto: UpdateProductDto): Product {
    const current = this.items.get(id);
    if (!current) throw new NotFoundException(`Không có sản phẩm #${id}`);
    const next: Product = { ...current };
    if (dto.sku !== undefined) {
      next.sku = normalizeSku(dto.sku);
      const other = this.findBySku(next.sku);
      if (other && other.id !== id) throw new ConflictException(`SKU ${next.sku} đã tồn tại`);
    }
    if (dto.name !== undefined) {
      if (typeof dto.name !== 'string' || dto.name.trim() === '' || dto.name.length > 120) {
        throw new BadRequestException('name phải là chuỗi 1..120 ký tự');
      }
      next.name = dto.name.trim();
    }
    if (dto.price !== undefined) {
      if (!Number.isInteger(dto.price) || dto.price < 0) throw new BadRequestException('price phải là số nguyên >= 0');
      next.price = dto.price;
    }
    if (dto.categoryId !== undefined) next.categoryId = dto.categoryId;
    if (dto.brand !== undefined) next.brand = dto.brand;
    if (dto.stock !== undefined) next.stock = dto.stock;
    if (dto.attributes !== undefined) next.attributes = dto.attributes;
    if (dto.isActive !== undefined) next.isActive = dto.isActive;
    this.items.set(id, next);
    return { ...next };
  }

  remove(id: number): void {
    if (!this.items.delete(id)) throw new NotFoundException(`Không có sản phẩm #${id}`);
  }
}

function normalizeSku(raw: unknown): string {
  if (typeof raw !== 'string') throw new BadRequestException('sku phải là chuỗi');
  const sku = raw.trim().toUpperCase();
  if (!SKU_PATTERN.test(sku)) throw new BadRequestException('sku phải khớp ^[A-Z0-9-]{3,20}$');
  return sku;
}
