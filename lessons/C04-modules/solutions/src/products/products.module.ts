import { Module } from '@nestjs/common';
import { ProductUsageModule } from '../product-usage/product-usage.module';
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
  imports: [ProductUsageModule],
  controllers: [ProductsController, ProductsV2Controller, ProductShortLinkController, LegacyController],
  providers: [ProductsService, { provide: PRODUCTS_REPOSITORY, useClass: InMemoryProductsRepository }],
  exports: [ProductsService], // PRODUCTS_REPOSITORY là chi tiết nội bộ: không export
})
export class ProductsModule {}
