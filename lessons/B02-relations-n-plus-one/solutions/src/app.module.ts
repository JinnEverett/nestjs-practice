import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { validateEnv } from './config/env';
import { DatabaseModule } from './database/database.module';
import { featuresConfig } from './config/features.config';
import { pricingConfig } from './config/pricing.config';
import { redisConfig } from './config/redis.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { GetCacheInterceptor } from './common/interceptors/get-cache.interceptor';
import { PaginationLinksInterceptor } from './common/interceptors/pagination-links.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { TimingInterceptor } from './common/interceptors/timing.interceptor';
import { httpLogger } from './common/middleware/http-logger.middleware';
import { noStore } from './common/middleware/no-store.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { UploadsModule } from './uploads/uploads.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { LifecycleModule } from './lifecycle/lifecycle.module';
import { ReportsController } from './reports/reports.controller';
import { OrdersController } from './orders/orders.controller';
import { OrdersModule } from './orders/orders.module';
import { PingController } from './ping/ping.controller';
import { PricingModule } from './pricing/pricing.module';
import { ProductsModule } from './products/products.module';
import { SharedModule } from './shared/shared.module';
import { TraceModule } from './trace/trace.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Ưu tiên: biến môi trường thật > .env.<NODE_ENV>.local > .env.<NODE_ENV> > .env
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}.local`, `.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      load: [appConfig, databaseConfig, redisConfig, authConfig, featuresConfig, pricingConfig],
      validate: (config) => validateEnv(config), // lỗi cấu hình = không khởi động
    }),
    DatabaseModule,
    SharedModule,
    PricingModule.forRootAsync({
      isGlobal: true,
      inject: [pricingConfig.KEY],
      useFactory: (pricing: ConfigType<typeof pricingConfig>) => pricing,
    }),
    ProductsModule,
    CategoriesModule,
    TagsModule,
    OrdersModule,
    TraceModule,
    LifecycleModule,
    UploadsModule,
  ],
  controllers: [PingController, ReportsController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Interceptor toàn cục: cái đăng ký trước là lớp NGOÀI cùng (vào trước, ra sau).
    { provide: APP_INTERCEPTOR, useClass: TimingInterceptor },
    // Link header suy ra từ body → đứng NGOÀI cache để HIT cũng có header.
    { provide: APP_INTERCEPTOR, useClass: PaginationLinksInterceptor },
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
