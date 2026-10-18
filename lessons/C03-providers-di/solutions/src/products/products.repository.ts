import { Product } from './entities/product.entity';

/** Token để inject repository. Dùng Symbol để không đụng tên với provider khác. */
export const PRODUCTS_REPOSITORY = Symbol('PRODUCTS_REPOSITORY');

export interface ProductsRepository {
  findAll(): Promise<Product[]>;
  findById(id: number): Promise<Product | undefined>;
  findBySku(sku: string): Promise<Product | undefined>;
  insert(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product>;
  update(id: number, patch: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | undefined>;
  delete(id: number): Promise<boolean>;
}
