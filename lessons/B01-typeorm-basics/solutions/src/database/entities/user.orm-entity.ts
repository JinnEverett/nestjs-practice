import { Check, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * Bảng `users`. Email luôn chữ thường: ràng buộc ở DB (`email = lower(email)`) để `A@x.com` và `a@x.com` không thể thành hai người dùng,
 * dù ghi bằng đường nào. Mật khẩu băm thêm ở A01 (và không bao giờ ra khỏi API).
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

  @Column({ type: 'varchar', length: 120, name: 'full_name' })
  fullName!: string;

  @Column({ type: 'varchar', length: 20, default: 'customer' })
  role!: 'customer' | 'admin';

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
