import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '../database/entities/product.orm-entity';
import { ProductUsageModule } from '../product-usage/product-usage.module';
import {
  LegacyController,
  ProductShortLinkController,
  ProductsController,
  ProductsV2Controller,
} from './products.controller';
import { PRODUCTS_REPOSITORY } from './products.repository';
import { ProductsService } from './products.service';
import { TypeOrmProductsRepository } from './typeorm-products.repository';

@Module({
  imports: [ProductUsageModule, TypeOrmModule.forFeature([ProductEntity])],
  controllers: [ProductsController, ProductsV2Controller, ProductShortLinkController, LegacyController],
  providers: [ProductsService, { provide: PRODUCTS_REPOSITORY, useClass: TypeOrmProductsRepository }],
  exports: [ProductsService], // PRODUCTS_REPOSITORY là chi tiết nội bộ: không export
})
export class ProductsModule {}
