import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { ProductEntity } from './product.orm-entity';

/**
 * `categories`: cây danh mục. `parent_id` tự tham chiếu `categories.id` (RESTRICT: không xóa được danh mục còn con).
 * Khóa ngoại KHÔNG tự có index trong Postgres: `idx_categories_parent` phục vụ "lấy các con của X" và việc kiểm tra RESTRICT.
 * Kiểu thuộc tính quan hệ dùng `Relation<T>` để tránh lỗi "before initialization" khi hai file entity import vòng tròn.
 */
@Entity({ name: 'categories' })
@Unique('uq_categories_slug', ['slug'])
@Index('idx_categories_parent', ['parentId'])
export class CategoryEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'parent_id', nullable: true })
  parentId!: number | null;

  @ManyToOne(() => CategoryEntity, (c) => c.children, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parent_id', foreignKeyConstraintName: 'fk_categories_parent' })
  parent?: Relation<CategoryEntity> | null;

  @OneToMany(() => CategoryEntity, (c) => c.parent)
  children?: Relation<CategoryEntity[]>;

  @OneToMany(() => ProductEntity, (p) => p.category)
  products?: Relation<ProductEntity[]>;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  slug!: string;
}
