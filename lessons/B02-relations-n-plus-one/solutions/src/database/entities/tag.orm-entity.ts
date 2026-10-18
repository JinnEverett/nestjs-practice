import { Check, Column, Entity, ManyToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { ProductEntity } from './product.orm-entity';

/** `tags`: nhãn dùng chung. Bảng nối `product_tags` do phía `ProductEntity` (bên sở hữu) khai báo bằng `@JoinTable`. */
@Entity({ name: 'tags' })
@Unique('uq_tags_name', ['name'])
@Check('ck_tags_name', `"name" ~ '^[a-z0-9-]{1,30}$'`)
export class TagEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 30 })
  name!: string;

  @ManyToMany(() => ProductEntity, (p) => p.tags)
  products?: Relation<ProductEntity[]>;
}
