import { Module } from '@nestjs/common';
import {
  LegacyController,
  ProductShortLinkController,
  ProductsController,
  ProductsV2Controller,
} from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController, ProductsV2Controller, ProductShortLinkController, LegacyController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
