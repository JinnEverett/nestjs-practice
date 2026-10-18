import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from '../config/database.config';
import { buildDataSourceOptions } from './data-source';
import { ORM_ENTITIES } from './orm-entities';

export { ORM_ENTITIES };

/**
 * Kết nối Postgres cho cả ứng dụng. `forRootAsync` + `inject: [databaseConfig.KEY]` để cấu hình đi qua `@nestjs/config`.
 * Tùy chọn kết nối lấy từ `buildDataSourceOptions` (cùng nguồn với CLI migration); module chỉ thêm các tùy chọn của riêng Nest.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (db: ConfigType<typeof databaseConfig>) => ({
        ...buildDataSourceOptions({ url: db.url, logging: db.logging }),
        migrationsRun: db.migrationsRun,
        retryAttempts: db.retryAttempts,
        retryDelay: db.retryDelay,
      }),
    }),
  ],
})
export class DatabaseModule {}
