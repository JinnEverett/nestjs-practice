import { forwardRef, Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { InMemoryProductsRepository } from './in-memory-products.repository';
import {
  LegacyController,
  ProductShortLinkController,
  ProductsController,
  ProductsV2Controller,
} from './products.controller';
import { PRODUCTS_REPOSITORY } from './products.repository';
import { ProductsService } from './products.service';

@Module({
  imports: [forwardRef(() => OrdersModule)],
  controllers: [ProductsController, ProductsV2Controller, ProductShortLinkController, LegacyController],
  providers: [ProductsService, { provide: PRODUCTS_REPOSITORY, useClass: InMemoryProductsRepository }],
  exports: [ProductsService],
})
export class ProductsModule {}
