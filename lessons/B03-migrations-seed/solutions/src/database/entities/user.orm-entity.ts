import { Check, Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { OrderEntity } from './order.orm-entity';
import { UserProfileEntity } from './user-profile.orm-entity';

/**
 * Bảng `users`. Email luôn chữ thường: ràng buộc ở DB (`email = lower(email)`). Mật khẩu băm thêm ở A01.
 * Quan hệ: 1-1 với `user_profiles` (bên không sở hữu), 1-n với `orders`.
 */
@Entity({ name: 'users' })
@Unique('uq_users_email', ['email'])
@Check('ck_users_email_lower', `"email" = lower("email")`)
@Check('ck_users_role', `"role" IN ('customer', 'admin')`)
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 254 })
  email!: string;

  /** Thuộc tính `fullName` giữ nguyên cho API, nhưng cột DB đã đổi tên thành `display_name` (migration RenameUserFullName). */
  @Column({ type: 'varchar', length: 120, name: 'display_name' })
  fullName!: string;

  @Column({ type: 'varchar', length: 20, default: 'customer' })
  role!: 'customer' | 'admin';

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @OneToOne(() => UserProfileEntity, (p) => p.user)
  profile?: Relation<UserProfileEntity>;

  @OneToMany(() => OrderEntity, (o) => o.user)
  orders?: Relation<OrderEntity[]>;
}
