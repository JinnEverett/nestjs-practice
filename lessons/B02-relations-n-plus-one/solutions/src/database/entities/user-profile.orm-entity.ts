import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from './user.orm-entity';

/**
 * `user_profiles`: quan hệ 1-1 với `users`. Khóa chính CHÍNH LÀ khóa ngoại (`user_id`): mỗi người dùng tối đa một hồ sơ, không cần
 * cột UNIQUE riêng. Bên sở hữu (có `@JoinColumn`) là bảng phụ thuộc. Xóa người dùng thì hồ sơ đi theo (CASCADE).
 */
@Entity({ name: 'user_profiles' })
export class UserProfileEntity {
  @PrimaryColumn({ type: 'integer', name: 'user_id' })
  userId!: number;

  @OneToOne(() => UserEntity, (u) => u.profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_user_profiles_user' })
  user?: Relation<UserEntity>;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
