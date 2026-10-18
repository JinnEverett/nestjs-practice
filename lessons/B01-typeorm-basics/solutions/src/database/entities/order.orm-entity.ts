import { Check, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { moneyTransformer } from '../transformers';

/**
 * Bảng `orders`. Mọi số tiền là `numeric(12,0)`. `total_amount` được ghi sẵn (không tính lại khi đọc) vì giá có thể đổi sau đó;
 * hằng đẳng thức `Σ(unit_price × quantity) + shipping_fee − discount_amount` là nghiệp vụ của B05, không ép ở DB.
 */
@Entity({ name: 'orders' })
@Check('ck_orders_status', `"status" IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')`)
@Check('ck_orders_amounts', '"shipping_fee" >= 0 AND "discount_amount" >= 0 AND "total_amount" >= 0')
export class OrderEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

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
