import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { moneyTransformer } from '../transformers';
import { OrderEntity } from './order.orm-entity';

/** `payments`: một đơn có thể có nhiều lần thanh toán. Khóa ngoại RESTRICT: chứng từ thanh toán không biến mất khi xóa đơn. */
@Entity({ name: 'payments' })
@Index('idx_payments_order', ['orderId'])
@Check('ck_payments_method', `"method" IN ('card', 'ewallet', 'bank_transfer', 'cod')`)
@Check('ck_payments_status', `"status" IN ('succeeded', 'failed', 'refunded')`)
@Check('ck_payments_amount', '"amount" >= 0')
export class PaymentEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'order_id' })
  orderId!: number;

  @ManyToOne(() => OrderEntity, (o) => o.payments, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id', foreignKeyConstraintName: 'fk_payments_order' })
  order?: Relation<OrderEntity>;

  @Column({ type: 'varchar', length: 20 })
  method!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ type: 'numeric', precision: 12, scale: 0, transformer: moneyTransformer })
  amount!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
