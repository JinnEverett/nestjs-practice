import { Module } from '@nestjs/common';
import { ProductUsageRegistry } from './product-usage.registry';

@Module({
  providers: [ProductUsageRegistry],
  exports: [ProductUsageRegistry],
})
export class ProductUsageModule {}
