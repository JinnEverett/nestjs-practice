import { Check, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { moneyTransformer } from '../transformers';

/** Bảng `payments`. Một đơn có thể có nhiều lần thanh toán (thử lại, hoàn tiền), nên KHÔNG unique theo `order_id`. */
@Entity({ name: 'payments' })
@Check('ck_payments_method', `"method" IN ('card', 'ewallet', 'bank_transfer', 'cod')`)
@Check('ck_payments_status', `"status" IN ('succeeded', 'failed', 'refunded')`)
@Check('ck_payments_amount', '"amount" >= 0')
export class PaymentEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'order_id' })
  orderId!: number;

  @Column({ type: 'varchar', length: 20 })
  method!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ type: 'numeric', precision: 12, scale: 0, transformer: moneyTransformer })
  amount!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
