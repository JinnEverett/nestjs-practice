import { Module } from '@nestjs/common';
import { ClockService } from '../clock/clock.service';
import { ProductUsageModule } from '../product-usage/product-usage.module';
import { ProductsModule } from '../products/products.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { NOW, ORDER_READER } from './orders.tokens';

// ClockService đến từ SharedModule (@Global), PricingService từ PricingModule.forRoot({ isGlobal: true }).
@Module({
  imports: [ProductsModule, ProductUsageModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    { provide: NOW, useFactory: (clock: ClockService) => () => clock.now(), inject: [ClockService] },
    { provide: ORDER_READER, useExisting: OrdersService },
  ],
  exports: [OrdersService, ORDER_READER],
})
export class OrdersModule {}
