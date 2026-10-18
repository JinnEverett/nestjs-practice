import 'reflect-metadata';
import { join } from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { loadEnv } from '../config/env';
import { ORM_ENTITIES } from './orm-entities';

/**
 * Cấu hình DataSource dùng chung: ứng dụng Nest (`DatabaseModule`), CLI migration (`npm run migration:*`) và script seed.
 * `synchronize` LUÔN tắt: từ B03 schema chỉ đổi bằng migration. Migration nằm ở `src/database/migrations/` (đuôi .ts khi chạy bằng ts-node/jest,
 * .js khi đã build).
 */
export function buildDataSourceOptions(overrides: { url: string; logging?: boolean }): DataSourceOptions {
  return {
    type: 'postgres',
    url: overrides.url,
    entities: ORM_ENTITIES,
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: 'migrations',
    // 'all' (mặc định): cả lô migration trong MỘT transaction, và migration nào đặt `transaction = false` sẽ bị từ chối
    // (ForbiddenTransactionModeOverrideError). 'each': mỗi migration một transaction riêng, và cho phép migration đặt `transaction = false`
    // (cần cho CREATE INDEX CONCURRENTLY). Cái giá: lỗi giữa lô chỉ hoàn tác migration đang chạy, các migration trước đó vẫn được áp dụng.
    migrationsTransactionMode: 'each',
    synchronize: false,
    logging: overrides.logging ?? false,
    applicationName: 'shop-api',
  };
}

/** Export mặc định cho CLI: `typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts`. */
export default new DataSource(buildDataSourceOptions({ url: loadEnv().DATABASE_URL }));
