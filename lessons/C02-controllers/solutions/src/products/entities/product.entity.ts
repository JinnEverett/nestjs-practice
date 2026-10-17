export class Product {
  id!: number;
  categoryId!: number;
  sku!: string;
  name!: string;
  brand!: string | null;
  price!: number;
  stock!: number;
  attributes!: Record<string, unknown>;
  isActive!: boolean;
  createdAt!: string;
}
