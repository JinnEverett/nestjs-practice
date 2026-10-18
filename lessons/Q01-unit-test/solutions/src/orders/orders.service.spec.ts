import { Test } from '@nestjs/testing';
import { PricingService } from '../pricing/pricing.service';
import { Product } from '../products/entities/product.entity';
import { ProductsService } from '../products/products.service';
import { OrdersService } from './orders.service';
import { NOW, ORDER_NOTIFIER } from './orders.tokens';

const FIXED = new Date('2026-05-06T07:08:09.000Z');
const product = (over: Partial<Product> = {}): Product => ({
  id: 1, categoryId: 1, sku: 'A-1', name: 'A', brand: null, price: 100_000, stock: 5,
  attributes: {}, isActive: true, createdAt: 'x', ...over,
});

describe('OrdersService', () => {
  const products = { findById: jest.fn(), adjustStock: jest.fn() };
  const pricing = { quote: jest.fn() };
  const notifier = { orderCreated: jest.fn() };
  const catalog = new Map<number, Product>();

  const build = async (withNotifier: boolean) => {
    const ref = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: ProductsService, useValue: products },
        { provide: PricingService, useValue: pricing },
        { provide: NOW, useValue: () => FIXED },
        ...(withNotifier ? [{ provide: ORDER_NOTIFIER, useValue: notifier }] : []),
      ],
    }).compile();
    return ref.get(OrdersService);
  };

  beforeEach(() => {
    jest.resetAllMocks();
    catalog.clear();
    catalog.set(1, product({ id: 1, price: 100_000, stock: 5 }));
    catalog.set(2, product({ id: 2, price: 50_000, stock: 1 }));
    products.findById.mockImplementation(async (id: number) => catalog.get(id));
    pricing.quote.mockReturnValue({ subtotal: 1, shippingFee: 2, discountAmount: 3, totalAmount: 4 });
  });

  it('dựng đơn từ báo giá: giá lấy từ sản phẩm, giờ lấy từ NOW, mã được chuẩn hóa', async () => {
    const service = await build(false);
    const order = await service.create({ items: [{ productId: 1, quantity: 2 }], discountCode: ' welcome10 ' });
    expect(pricing.quote).toHaveBeenCalledWith([{ productId: 1, quantity: 2, unitPrice: 100_000 }], 'WELCOME10');
    expect(order).toMatchObject({
      status: 'pending', userId: 1, discountCode: 'WELCOME10', shippingFee: 2, discountAmount: 3, totalAmount: 4,
      createdAt: FIXED.toISOString(), updatedAt: FIXED.toISOString(),
      items: [{ productId: 1, quantity: 2, unitPrice: 100_000 }],
    });
    expect(products.adjustStock).toHaveBeenCalledWith(1, -2);
  });

  it('không có mã → discountCode null', async () => {
    const service = await build(false);
    expect((await service.create({ items: [{ productId: 1, quantity: 1 }] })).discountCode).toBeNull();
  });

  it('gộp các dòng cùng sản phẩm', async () => {
    const service = await build(false);
    const order = await service.create({ items: [{ productId: 1, quantity: 2 }, { productId: 1, quantity: 3 }] });
    expect(order.items).toEqual([{ productId: 1, quantity: 5, unitPrice: 100_000 }]);
    expect(products.adjustStock).toHaveBeenCalledTimes(1);
    expect(products.adjustStock).toHaveBeenCalledWith(1, -5);
  });

  it('tồn kho: đặt vừa hết được, vượt 1 thì 409', async () => {
    const service = await build(false);
    await expect(service.create({ items: [{ productId: 1, quantity: 5 }] })).resolves.toBeDefined();
    await expect(service.create({ items: [{ productId: 1, quantity: 6 }] })).rejects.toMatchObject({ status: 409 });
  });

  it('sản phẩm không có hoặc ngừng bán → 422', async () => {
    const service = await build(false);
    catalog.set(3, product({ id: 3, isActive: false }));
    await expect(service.create({ items: [{ productId: 99, quantity: 1 }] })).rejects.toMatchObject({ status: 422 });
    await expect(service.create({ items: [{ productId: 3, quantity: 1 }] })).rejects.toMatchObject({ status: 422 });
  });

  it('đơn bị từ chối thì không trừ kho dòng nào (lỗi ở dòng sau / ở báo giá)', async () => {
    const service = await build(false);
    await expect(
      service.create({ items: [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 2 }] }),
    ).rejects.toMatchObject({ status: 409 });
    pricing.quote.mockImplementation(() => {
      throw new Error('mã sai');
    });
    await expect(service.create({ items: [{ productId: 1, quantity: 1 }], discountCode: 'X' })).rejects.toThrow('mã sai');
    expect(products.adjustStock).not.toHaveBeenCalled();
  });

  it.each([
    [{}], [{ items: [] }], [{ items: [{ productId: 1, quantity: 0 }] }],
    [{ items: [{ productId: 1.5, quantity: 1 }] }], [{ items: [{ productId: 1, quantity: '1' }] }],
  ])('body sai %j → 400', async (dto) => {
    const service = await build(false);
    await expect(service.create(dto as never)).rejects.toMatchObject({ status: 400 });
  });

  it('findById: 404 khi không có; trả bản sao (sửa kết quả không đổi dữ liệu lưu)', async () => {
    const service = await build(false);
    expect(() => service.findById(404)).toThrow(expect.objectContaining({ status: 404 }));
    const created = await service.create({ items: [{ productId: 1, quantity: 1 }] });
    const a = service.findById(created.id);
    a.items[0].quantity = 999;
    expect(service.findById(created.id).items[0].quantity).toBe(1);
  });

  it('hasOrdersFor biết sản phẩm nào đã được đặt', async () => {
    const service = await build(false);
    await service.create({ items: [{ productId: 1, quantity: 1 }] });
    expect(service.hasOrdersFor(1)).toBe(true);
    expect(service.hasOrdersFor(2)).toBe(false);
  });

  describe('notifier', () => {
    it('được gọi một lần với đơn vừa tạo', async () => {
      const service = await build(true);
      const order = await service.create({ items: [{ productId: 1, quantity: 1 }] });
      expect(notifier.orderCreated).toHaveBeenCalledTimes(1);
      expect(notifier.orderCreated).toHaveBeenCalledWith(order);
    });
    it('ném lỗi cũng không làm hỏng đơn', async () => {
      notifier.orderCreated.mockRejectedValue(new Error('smtp down'));
      const service = await build(true);
      await expect(service.create({ items: [{ productId: 1, quantity: 1 }] })).resolves.toMatchObject({ id: 1 });
    });
  });
});
