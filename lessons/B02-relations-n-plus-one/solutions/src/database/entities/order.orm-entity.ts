import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { moneyTransformer } from '../transformers';
import { OrderItemEntity } from './order-item.orm-entity';
import { PaymentEntity } from './payment.orm-entity';
import { UserEntity } from './user.orm-entity';

/**
 * Bảng `orders`. Mọi số tiền là `numeric(12,0)`. `user_id` có khóa ngoại RESTRICT: không xóa được người dùng còn đơn hàng.
 */
@Entity({ name: 'orders' })
@Index('idx_orders_user', ['userId'])
@Check('ck_orders_status', `"status" IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')`)
@Check('ck_orders_amounts', '"shipping_fee" >= 0 AND "discount_amount" >= 0 AND "total_amount" >= 0')
export class OrderEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  @ManyToOne(() => UserEntity, (u) => u.orders, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_orders_user' })
  user?: Relation<UserEntity>;

  @OneToMany(() => OrderItemEntity, (i) => i.order)
  items?: Relation<OrderItemEntity[]>;

  @OneToMany(() => PaymentEntity, (p) => p.order)
  payments?: Relation<PaymentEntity[]>;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: string;

  @Column({ type: 'numeric', precision: 12, scale: 0, name: 'shipping_fee', default: 0, transformer: moneyTransformer })
  shippingFee!: number;

  @Column({ type: 'varchar', length: 40, name: 'discount_code', nullable: true })
  discountCode!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 0, name: 'discount_amount', default: 0, transformer: moneyTransformer })
  discountAmount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 0, name: 'total_amount', transformer: moneyTransformer })
  totalAmount!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
