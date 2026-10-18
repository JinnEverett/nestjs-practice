import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { GetCacheInterceptor } from './common/interceptors/get-cache.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { TimingInterceptor } from './common/interceptors/timing.interceptor';
import { httpLogger } from './common/middleware/http-logger.middleware';
import { noStore } from './common/middleware/no-store.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { OrdersController } from './orders/orders.controller';
import { OrdersModule } from './orders/orders.module';
import { PingController } from './ping/ping.controller';
import { PricingModule } from './pricing/pricing.module';
import { ProductsModule } from './products/products.module';
import { SharedModule } from './shared/shared.module';
import { TraceModule } from './trace/trace.module';

@Module({
  imports: [SharedModule, PricingModule.forRoot({ isGlobal: true }), ProductsModule, OrdersModule, TraceModule],
  controllers: [PingController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Interceptor toàn cục: cái đăng ký trước là lớp NGOÀI cùng (vào trước, ra sau).
    { provide: APP_INTERCEPTOR, useClass: TimingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: GetCacheInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Thứ tự apply = thứ tự chạy. Id phải có trước khi logger đọc.
    consumer.apply(RequestIdMiddleware).forRoutes({ path: '*splat', method: RequestMethod.ALL });
    consumer.apply(httpLogger).exclude('ping').forRoutes({ path: '*splat', method: RequestMethod.ALL });
    consumer.apply(noStore).forRoutes(OrdersController); // tự hiểu tiền tố phiên bản của controller
  }
}
