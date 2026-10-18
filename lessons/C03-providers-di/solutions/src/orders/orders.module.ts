import { forwardRef, Module } from '@nestjs/common';
import { ClockModule } from '../clock/clock.module';
import { ClockService } from '../clock/clock.service';
import { PricingModule } from '../pricing/pricing.module';
import { ProductsModule } from '../products/products.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { NOW, ORDER_READER } from './orders.tokens';

@Module({
  imports: [ClockModule, PricingModule, forwardRef(() => ProductsModule)],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    // useFactory: dựng một hàm "bây giờ" từ ClockService (đổi ClockService trong test → đổi giờ của đơn).
    { provide: NOW, useFactory: (clock: ClockService) => () => clock.now(), inject: [ClockService] },
    // useExisting: bí danh trỏ vào CÙNG instance của OrdersService.
    { provide: ORDER_READER, useExisting: OrdersService },
  ],
  exports: [OrdersService, ORDER_READER],
})
export class OrdersModule {}
