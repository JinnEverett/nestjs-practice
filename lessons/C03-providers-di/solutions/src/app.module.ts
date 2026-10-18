import { Module } from '@nestjs/common';
import { ClockModule } from './clock/clock.module';
import { OrdersModule } from './orders/orders.module';
import { PingController } from './ping/ping.controller';
import { PricingModule } from './pricing/pricing.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [ClockModule, PricingModule, ProductsModule, OrdersModule],
  controllers: [PingController],
})
export class AppModule {}
