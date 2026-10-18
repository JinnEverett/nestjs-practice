export class CreateProductDto {
  sku!: string;
  name!: string;
  price!: number;
  categoryId?: number;
  brand?: string | null;
  stock?: number;
  attributes?: Record<string, unknown>;
  isActive?: boolean;
}
