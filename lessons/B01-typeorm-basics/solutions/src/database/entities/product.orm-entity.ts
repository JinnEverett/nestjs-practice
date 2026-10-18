import { Check, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { moneyTransformer } from '../transformers';

/**
 * Bảng `products`. Ràng buộc nằm ở CẢ HAI tầng: DTO chặn sớm cho thông báo đẹp, còn DB là chốt cuối
 * (có đường ghi khác, ví dụ job nhập liệu, script, hay chính race condition, không đi qua DTO).
 * Chưa khai báo quan hệ/khóa ngoại tới `categories` — đó là việc của B02.
 */
@Entity({ name: 'products' })
@Unique('uq_products_sku', ['sku'])
@Check('ck_products_sku_format', `"sku" ~ '^[A-Z0-9-]{3,20}$'`)
@Check('ck_products_price', '"price" >= 0')
@Check('ck_products_stock', '"stock" >= 0')
export class ProductEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'category_id', default: 1 })
  categoryId!: number;

  @Column({ type: 'varchar', length: 20 })
  sku!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  brand!: string | null;

  /** VND, số nguyên. `numeric(12,0)` + transformer, KHÔNG dùng `float`/`real`. */
  @Column({ type: 'numeric', precision: 12, scale: 0, transformer: moneyTransformer })
  price!: number;

  @Column({ type: 'integer', default: 0 })
  stock!: number;

  @Column({ type: 'jsonb', default: () => `'{}'::jsonb` })
  attributes!: Record<string, unknown>;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  /** `timestamptz`: Postgres lưu thời điểm tuyệt đối (UTC) nên không phụ thuộc múi giờ của máy chủ/ứng dụng. */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
