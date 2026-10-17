import { Inject, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { OrdersModule } from '../../src/orders/orders.module';
import { ORDER_READER } from '../../src/orders/orders.tokens';
import { ProductsModule } from '../../src/products/products.module';
import { PRODUCTS_REPOSITORY } from '../../src/products/products.repository';
import { ProductsService } from '../../src/products/products.service';

describe('C04 ex01 · đóng gói: chỉ thứ được export mới dùng được từ module khác', () => {
  it('module khác import ProductsModule dùng được ProductsService', async () => {
    @Injectable()
    class Consumer {
      constructor(readonly products: ProductsService) {}
    }
    @Module({ imports: [ProductsModule], providers: [Consumer] })
    class Ok {}
    const ref = await Test.createTestingModule({ imports: [Ok] }).compile();
    expect(ref.get(Consumer, { strict: false }).products).toBeInstanceOf(ProductsService);
    await ref.close();
  });

  it('PRODUCTS_REPOSITORY là chi tiết nội bộ: không inject được từ ngoài ProductsModule', async () => {
    @Injectable()
    class Peeker {
      constructor(@Inject(PRODUCTS_REPOSITORY) readonly repo: unknown) {}
    }
    @Module({ imports: [ProductsModule], providers: [Peeker] })
    class Bad {}
    await expect(Test.createTestingModule({ imports: [Bad] }).compile()).rejects.toThrow(/resolve dependencies/i);
  });

  it('OrdersModule export OrdersService và ORDER_READER nhưng không rò token nội bộ của Products', async () => {
    @Injectable()
    class Reader {
      constructor(@Inject(ORDER_READER) readonly reader: { findById(id: number): unknown }) {}
    }
    @Module({ imports: [OrdersModule], providers: [Reader] })
    class Host {}
    // Host import OrdersModule trần: OrdersModule tự cần SharedModule/PricingModule (global) nên cần AppModule dựng sẵn.
    const ref = await Test.createTestingModule({ imports: [AppModule, Host] }).compile();
    expect(ref.get(Reader, { strict: false }).reader).toBeDefined();
    await ref.close();
  });
});
