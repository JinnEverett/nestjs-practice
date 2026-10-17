import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { OrdersModule } from './orders/orders.module';
import { PingController } from './ping/ping.controller';
import { PricingModule } from './pricing/pricing.module';
import { ProductsModule } from './products/products.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [SharedModule, PricingModule.forRoot({ isGlobal: true }), ProductsModule, OrdersModule],
  controllers: [PingController],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
