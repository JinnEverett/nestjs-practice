import { Injectable } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { ProductsRepository } from './products.repository';

@Injectable()
export class InMemoryProductsRepository implements ProductsRepository {
  private readonly items = new Map<number, Product>();
  private nextId = 1;

  async findAll(): Promise<Product[]> {
    return [...this.items.values()].map((p) => ({ ...p }));
  }

  async findById(id: number): Promise<Product | undefined> {
    const p = this.items.get(id);
    return p && { ...p };
  }

  async findBySku(sku: string): Promise<Product | undefined> {
    for (const p of this.items.values()) if (p.sku === sku) return { ...p };
    return undefined;
  }

  async insert(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const product: Product = { ...data, id: this.nextId++, createdAt: new Date().toISOString() };
    this.items.set(product.id, product);
    return { ...product };
  }

  async update(id: number, patch: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | undefined> {
    const current = this.items.get(id);
    if (!current) return undefined;
    const next = { ...current, ...patch };
    this.items.set(id, next);
    return { ...next };
  }

  async delete(id: number): Promise<boolean> {
    return this.items.delete(id);
  }
}
