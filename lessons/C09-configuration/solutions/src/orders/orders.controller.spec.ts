import { Test } from '@nestjs/testing';
import { authConfig } from '../config/auth.config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  const service = { create: jest.fn(), findById: jest.fn() };
  let controller: OrdersController;

  beforeEach(async () => {
    jest.resetAllMocks();
    const ref = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: service },
        { provide: authConfig.KEY, useValue: { adminApiKey: 'test-key' } }, // ApiKeyGuard (gắn bởi @AdminOnly) cần config
      ],
    }).compile();
    controller = ref.get(OrdersController);
  });

  it('create: chuyển body cho service, đặt Location và trả đúng đơn', async () => {
    const order = { id: 42, totalAmount: 130_000 };
    service.create.mockResolvedValue(order);
    const res = { location: jest.fn() };
    const dto = { items: [{ productId: 1, quantity: 1 }] };
    const result = await controller.create(dto, res as never);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res.location).toHaveBeenCalledWith('/v1/orders/42');
    expect(result).toBe(order);
  });

  it('create: service ném lỗi thì không đặt Location', async () => {
    service.create.mockRejectedValue(new Error('boom'));
    const res = { location: jest.fn() };
    await expect(controller.create({ items: [] }, res as never)).rejects.toThrow('boom');
    expect(res.location).not.toHaveBeenCalled();
  });

  it('findOne: hỏi đúng id', () => {
    service.findById.mockReturnValue({ id: 7 });
    expect(controller.findOne(7)).toEqual({ id: 7 });
    expect(service.findById).toHaveBeenCalledWith(7);
  });
});
