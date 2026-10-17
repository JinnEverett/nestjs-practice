import { Test } from '@nestjs/testing';
import { OrdersService } from '../orders/orders.service';
import { Product } from './entities/product.entity';
import { PRODUCTS_REPOSITORY } from './products.repository';
import { ProductsService } from './products.service';

const product = (over: Partial<Product> = {}): Product => ({
  id: 1, categoryId: 1, sku: 'AO-1', name: 'Áo', brand: null, price: 100_000, stock: 5,
  attributes: {}, isActive: true, createdAt: '2026-01-01T00:00:00.000Z', ...over,
});

describe('ProductsService', () => {
  let service: ProductsService;
  const repo = {
    findAll: jest.fn(), findById: jest.fn(), findBySku: jest.fn(),
    insert: jest.fn(), update: jest.fn(), delete: jest.fn(),
  };
  const orders = { hasOrdersFor: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const ref = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PRODUCTS_REPOSITORY, useValue: repo },
        { provide: OrdersService, useValue: orders },
      ],
    }).compile();
    service = ref.get(ProductsService);
  });

  describe('create', () => {
    it('chuẩn hóa SKU và name, điền mặc định rồi gọi repo.insert', async () => {
      repo.findBySku.mockResolvedValue(undefined);
      repo.insert.mockImplementation(async (d: object) => ({ ...d, id: 9, createdAt: 'x' }));
      await service.create({ sku: ' ao-1 ', name: '  Áo  ', price: 0 });
      expect(repo.findBySku).toHaveBeenCalledWith('AO-1');
      expect(repo.insert).toHaveBeenCalledWith({
        categoryId: 1, sku: 'AO-1', name: 'Áo', brand: null, price: 0, stock: 0, attributes: {}, isActive: true,
      });
    });
    it('SKU đã có → 409 và không insert', async () => {
      repo.findBySku.mockResolvedValue(product());
      await expect(service.create({ sku: 'ao-1', name: 'x', price: 1 })).rejects.toMatchObject({ status: 409 });
      expect(repo.insert).not.toHaveBeenCalled();
    });
    it.each([
      [{ sku: 'ab', name: 'x', price: 1 }],
      [{ sku: 'AB-1', name: '', price: 1 }],
      [{ sku: 'AB-1', name: 'x'.repeat(121), price: 1 }],
      [{ sku: 'AB-1', name: 'x', price: -1 }],
      [{ sku: 'AB-1', name: 'x', price: 1.5 }],
    ])('dữ liệu sai %j → 400', async (dto) => {
      await expect(service.create(dto)).rejects.toMatchObject({ status: 400 });
      expect(repo.insert).not.toHaveBeenCalled();
    });
    it('giá 0 hợp lệ, tên dài đúng 120 ký tự hợp lệ', async () => {
      repo.findBySku.mockResolvedValue(undefined);
      repo.insert.mockResolvedValue(product());
      await expect(service.create({ sku: 'AB-1', name: 'x'.repeat(120), price: 0 })).resolves.toBeDefined();
    });
  });

  describe('update', () => {
    it('không tồn tại → 404', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.update(1, { price: 1 })).rejects.toMatchObject({ status: 404 });
    });
    it('đổi sang SKU của sản phẩm khác → 409, giữ SKU của chính nó → ok', async () => {
      repo.findById.mockResolvedValue(product({ id: 1 }));
      repo.update.mockResolvedValue(product());
      repo.findBySku.mockResolvedValue(product({ id: 2 }));
      await expect(service.update(1, { sku: 'b-2' })).rejects.toMatchObject({ status: 409 });
      repo.findBySku.mockResolvedValue(product({ id: 1 }));
      await expect(service.update(1, { sku: 'ao-1' })).resolves.toBeDefined();
    });
    it('chỉ gửi trường được truyền; null và 0 được áp dụng', async () => {
      repo.findById.mockResolvedValue(product());
      repo.update.mockResolvedValue(product());
      await service.update(1, { brand: null, stock: 0, isActive: false });
      expect(repo.update).toHaveBeenCalledWith(1, { brand: null, stock: 0, isActive: false });
    });
  });

  describe('remove', () => {
    it('không tồn tại → 404', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.remove(1)).rejects.toMatchObject({ status: 404 });
      expect(repo.delete).not.toHaveBeenCalled();
    });
    it('đã nằm trong đơn → 409 và không xóa', async () => {
      repo.findById.mockResolvedValue(product());
      orders.hasOrdersFor.mockReturnValue(true);
      await expect(service.remove(1)).rejects.toMatchObject({ status: 409 });
      expect(repo.delete).not.toHaveBeenCalled();
    });
    it('chưa có đơn → xóa', async () => {
      repo.findById.mockResolvedValue(product());
      orders.hasOrdersFor.mockReturnValue(false);
      await service.remove(1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('findAll', () => {
    const base = { page: 1, limit: 20, sort: { field: 'id' as const, desc: false } };
    const stock = [
      product({ id: 1, name: 'Áo thun', brand: 'Acme', price: 0 }),
      product({ id: 2, name: 'Quần (slim)', brand: 'acme', price: 300 }),
      product({ id: 3, name: 'Mũ', brand: null, price: 300 }),
    ];
    beforeEach(() => repo.findAll.mockResolvedValue(stock.map((p) => ({ ...p }))));

    it('lọc brand không phân biệt hoa thường, maxPrice=0 vẫn là bộ lọc', async () => {
      expect((await service.findAll({ ...base, brand: 'ACME' })).data.map((p) => p.id)).toEqual([1, 2]);
      expect((await service.findAll({ ...base, maxPrice: 0 })).data.map((p) => p.id)).toEqual([1]);
    });
    it('q là so khớp nguyên văn không phân biệt hoa thường', async () => {
      expect((await service.findAll({ ...base, q: '(SLIM' })).data.map((p) => p.id)).toEqual([2]);
    });
    it('hòa giá thì id tăng dần, kể cả sort giảm dần; total đếm sau lọc', async () => {
      const r = await service.findAll({ ...base, limit: 1, page: 1, sort: { field: 'price', desc: true } });
      expect(r.data.map((p) => p.id)).toEqual([2]);
      expect(r.meta).toEqual({ page: 1, limit: 1, total: 3 });
      expect((await service.findAll({ ...base, sort: { field: 'price', desc: true } })).data.map((p) => p.id)).toEqual([2, 3, 1]);
    });
    it('minPrice bao gồm biên', async () => {
      expect((await service.findAll({ ...base, minPrice: 300 })).data.map((p) => p.id)).toEqual([2, 3]);
    });
  });
});
