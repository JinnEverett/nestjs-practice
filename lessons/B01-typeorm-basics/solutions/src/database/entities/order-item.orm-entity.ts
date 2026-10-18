import { Check, Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { moneyTransformer } from '../transformers';

/**
 * Bảng `order_items`. `unit_price` là giá TẠI THỜI ĐIỂM ĐẶT (sao chép, không tham chiếu giá hiện tại của sản phẩm).
 * Một sản phẩm chỉ xuất hiện một dòng trong mỗi đơn: `UNIQUE (order_id, product_id)` (gộp số lượng, không thêm dòng trùng).
 */
@Entity({ name: 'order_items' })
@Unique('uq_order_items_order_product', ['orderId', 'productId'])
@Check('ck_order_items_quantity', '"quantity" > 0')
@Check('ck_order_items_unit_price', '"unit_price" >= 0')
export class OrderItemEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'order_id' })
  orderId!: number;

  @Column({ type: 'integer', name: 'product_id' })
  productId!: number;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'numeric', precision: 12, scale: 0, name: 'unit_price', transformer: moneyTransformer })
  unitPrice!: number;
}
