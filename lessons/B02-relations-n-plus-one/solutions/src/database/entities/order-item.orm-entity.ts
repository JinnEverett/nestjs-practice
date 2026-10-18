import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { moneyTransformer } from '../transformers';
import { OrderEntity } from './order.orm-entity';
import { ProductEntity } from './product.orm-entity';

/**
 * `order_items`. `unit_price` là giá TẠI THỜI ĐIỂM ĐẶT (sao chép, không tham chiếu giá hiện tại). Xóa đơn thì các dòng đi theo (CASCADE);
 * xóa sản phẩm đã nằm trong đơn bị chặn (RESTRICT): lịch sử đơn hàng không được mất.
 * `UNIQUE (order_id, product_id)` đã phủ truy vấn theo `order_id` (cột đầu của index), nên chỉ cần thêm index cho `product_id`.
 */
@Entity({ name: 'order_items' })
@Unique('uq_order_items_order_product', ['orderId', 'productId'])
@Index('idx_order_items_product', ['productId'])
@Check('ck_order_items_quantity', '"quantity" > 0')
@Check('ck_order_items_unit_price', '"unit_price" >= 0')
export class OrderItemEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'order_id' })
  orderId!: number;

  @ManyToOne(() => OrderEntity, (o) => o.items, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id', foreignKeyConstraintName: 'fk_order_items_order' })
  order?: Relation<OrderEntity>;

  @Column({ type: 'integer', name: 'product_id' })
  productId!: number;

  @ManyToOne(() => ProductEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id', foreignKeyConstraintName: 'fk_order_items_product' })
  product?: Relation<ProductEntity>;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'numeric', precision: 12, scale: 0, name: 'unit_price', transformer: moneyTransformer })
  unitPrice!: number;
}
