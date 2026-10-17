import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { PingController } from './ping/ping.controller';
import { PricingModule } from './pricing/pricing.module';
import { ProductsModule } from './products/products.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [SharedModule, PricingModule.forRoot({ isGlobal: true }), ProductsModule, OrdersModule],
  controllers: [PingController],
})
export class AppModule {}
