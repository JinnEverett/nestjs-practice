export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export class Order {
  id!: number;
  userId!: number;
  status!: OrderStatus;
  items!: OrderItem[];
  shippingFee!: number;
  discountCode!: string | null;
  discountAmount!: number;
  totalAmount!: number;
  createdAt!: string;
  updatedAt!: string;
}

export interface OrderReader {
  findById(id: number): Order;
}

export interface OrderNotifier {
  orderCreated(order: Order): void | Promise<void>;
}
