import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OutOfStockError } from '../common/errors/domain-errors';
import { ProductUsageRegistry } from '../product-usage/product-usage.registry';
import { PricingService } from '../pricing/pricing.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, type OrderNotifier, type OrderReader } from './entities/order.entity';
import { NOW, ORDER_NOTIFIER } from './orders.tokens';

@Injectable()
export class OrdersService implements OrderReader {
  private readonly logger = new Logger(OrdersService.name);
  private readonly orders = new Map<number, Order>();
  private nextId = 1;

  constructor(
    private readonly products: ProductsService,
    private readonly pricing: PricingService,
    private readonly usage: ProductUsageRegistry,
    @Inject(NOW) private readonly now: () => Date,
    @Optional() @Inject(ORDER_NOTIFIER) private readonly notifier?: OrderNotifier,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const wanted = mergeLines(dto);

    // Pha 1: đọc + kiểm tra TẤT CẢ, chưa đổi gì. Lỗi ở dòng nào cũng không để lại dấu vết.
    const lines: { productId: number; quantity: number; unitPrice: number }[] = [];
    for (const [productId, quantity] of wanted) {
      const product = await this.products.findById(productId);
      if (!product) throw new UnprocessableEntityException(`Sản phẩm #${productId} không tồn tại`);
      if (!product.isActive) throw new UnprocessableEntityException(`Sản phẩm #${productId} đã ngừng bán`);
      if (product.stock < quantity) throw new OutOfStockError(productId, quantity, product.stock);
      lines.push({ productId, quantity, unitPrice: product.price }); // giá lấy từ DB, không tin client
    }
    const code = dto.discountCode?.trim() ? dto.discountCode.trim().toUpperCase() : null;
    const quote = this.pricing.quote(lines, code);

    // Pha 2: áp dụng thay đổi.
    for (const l of lines) await this.products.adjustStock(l.productId, -l.quantity);
    const at = this.now().toISOString();
    const order: Order = {
      id: this.nextId++,
      userId: 1,
      status: 'pending',
      items: lines,
      shippingFee: quote.shippingFee,
      discountCode: code,
      discountAmount: quote.discountAmount,
      totalAmount: quote.totalAmount,
      createdAt: at,
      updatedAt: at,
    };
    this.orders.set(order.id, order);
    this.usage.markUsed(lines.map((l) => l.productId));
    await this.notify(order);
    return structuredClone(order);
  }

  findById(id: number): Order {
    const o = this.orders.get(id);
    if (!o) throw new NotFoundException(`Không có đơn hàng #${id}`);
    return structuredClone(o);
  }

  private async notify(order: Order): Promise<void> {
    try {
      await this.notifier?.orderCreated(structuredClone(order));
    } catch (err) {
      // Thông báo hỏng không được làm hỏng đơn đã tạo.
      this.logger.warn(`notifier lỗi cho đơn #${order.id}: ${(err as Error).message}`);
    }
  }
}

/** Kiểm tra body và gộp các dòng trùng productId (cộng dồn quantity). */
function mergeLines(dto: CreateOrderDto): Map<number, number> {
  const items: unknown = dto?.items;
  if (!Array.isArray(items) || items.length === 0) throw new BadRequestException('items phải là mảng không rỗng');
  const merged = new Map<number, number>();
  for (const item of items as { productId?: unknown; quantity?: unknown }[]) {
    const { productId, quantity } = item ?? {};
    if (typeof productId !== 'number' || !Number.isInteger(productId) || productId < 1) {
      throw new BadRequestException('productId phải là số nguyên dương');
    }
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('quantity phải là số nguyên >= 1');
    }
    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }
  if (dto.discountCode !== undefined && dto.discountCode !== null && typeof dto.discountCode !== 'string') {
    throw new BadRequestException('discountCode phải là chuỗi');
  }
  return merged;
}
