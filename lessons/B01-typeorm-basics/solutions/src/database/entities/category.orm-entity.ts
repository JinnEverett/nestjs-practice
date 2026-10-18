import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

/** Bảng `categories` (cây danh mục: `parent_id` tự tham chiếu, khóa ngoại thêm ở B02). */
@Entity({ name: 'categories' })
@Unique('uq_categories_slug', ['slug'])
export class CategoryEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'parent_id', nullable: true })
  parentId!: number | null;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  slug!: string;
}
