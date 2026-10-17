import { ApiProperty } from '@nestjs/swagger';

export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export class OrderItem {
  @ApiProperty({ example: 42 }) productId!: number;
  @ApiProperty({ example: 2, minimum: 1 }) quantity!: number;
  @ApiProperty({ example: 199000, description: 'Giá tại thời điểm đặt (VND)' }) unitPrice!: number;
}

export class Order {
  @ApiProperty({ example: 1001 }) id!: number;
  @ApiProperty({ example: 1 }) userId!: number;
  @ApiProperty({ enum: ORDER_STATUSES, example: 'pending' }) status!: OrderStatus;
  @ApiProperty({ type: [OrderItem] }) items!: OrderItem[];
  @ApiProperty({ example: 30000 }) shippingFee!: number;
  @ApiProperty({ type: String, nullable: true, example: 'WELCOME10' }) discountCode!: string | null;
  @ApiProperty({ example: 39800 }) discountAmount!: number;
  @ApiProperty({ example: 388200, description: 'Σ(unitPrice × quantity) + shippingFee − discountAmount' }) totalAmount!: number;
  @ApiProperty({ format: 'date-time', example: '2026-10-17T08:00:00.000Z' }) createdAt!: string;
  @ApiProperty({ format: 'date-time', example: '2026-10-17T08:00:00.000Z' }) updatedAt!: string;
}

export interface OrderReader {
  findById(id: number): Order;
}

export interface OrderNotifier {
  orderCreated(order: Order): void | Promise<void>;
}
