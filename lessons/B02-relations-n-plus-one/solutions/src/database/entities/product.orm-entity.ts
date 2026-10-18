import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { moneyTransformer } from '../transformers';
import { CategoryEntity } from './category.orm-entity';
import { TagEntity } from './tag.orm-entity';

/**
 * Bảng `products`. Từ B02 có khóa ngoại `fk_products_category` (RESTRICT) và quan hệ n-n với `tags` qua bảng nối `product_tags`.
 * Ràng buộc nằm ở CẢ HAI tầng: DTO chặn sớm cho thông báo đẹp, còn DB là chốt cuối.
 */
@Entity({ name: 'products' })
@Unique('uq_products_sku', ['sku'])
@Index('idx_products_category', ['categoryId'])
@Check('ck_products_sku_format', `"sku" ~ '^[A-Z0-9-]{3,20}$'`)
@Check('ck_products_price', '"price" >= 0')
@Check('ck_products_stock', '"stock" >= 0')
export class ProductEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'category_id', default: 1 })
  categoryId!: number;

  @ManyToOne(() => CategoryEntity, (c) => c.products, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id', foreignKeyConstraintName: 'fk_products_category' })
  category?: Relation<CategoryEntity>;

  /** Bên SỞ HỮU của quan hệ n-n: giữ `@JoinTable`. Xóa sản phẩm hoặc nhãn thì dòng nối bị xóa theo (CASCADE), nhãn/sản phẩm kia còn nguyên. */
  @ManyToMany(() => TagEntity, (t) => t.products)
  @JoinTable({
    name: 'product_tags',
    joinColumn: { name: 'product_id', foreignKeyConstraintName: 'fk_product_tags_product' },
    inverseJoinColumn: { name: 'tag_id', foreignKeyConstraintName: 'fk_product_tags_tag' },
  })
  tags?: Relation<TagEntity[]>;

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
