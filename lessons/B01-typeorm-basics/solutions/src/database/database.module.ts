import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from '../config/database.config';
import { CategoryEntity } from './entities/category.orm-entity';
import { OrderItemEntity } from './entities/order-item.orm-entity';
import { OrderEntity } from './entities/order.orm-entity';
import { PaymentEntity } from './entities/payment.orm-entity';
import { ProductEntity } from './entities/product.orm-entity';
import { UserEntity } from './entities/user.orm-entity';

export const ORM_ENTITIES = [ProductEntity, CategoryEntity, UserEntity, OrderEntity, OrderItemEntity, PaymentEntity];

/**
 * Kết nối Postgres cho cả ứng dụng. `forRootAsync` + `inject: [databaseConfig.KEY]` để cấu hình đi qua `@nestjs/config`
 * (đã kiểm tra lúc khởi động) thay vì đọc `process.env` trực tiếp. `DataSource` được đăng ký toàn cục: inject ở đâu cũng được.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (db: ConfigType<typeof databaseConfig>) => ({
        type: 'postgres' as const,
        url: db.url,
        entities: ORM_ENTITIES,
        synchronize: db.synchronize,
        logging: db.logging,
        retryAttempts: db.retryAttempts,
        retryDelay: db.retryDelay,
        applicationName: 'shop-api', // hiện trong pg_stat_activity (O03/O04)
      }),
    }),
  ],
})
export class DatabaseModule {}
