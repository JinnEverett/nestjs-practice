import { registerAs } from '@nestjs/config';
import { loadEnv } from './env';

/**
 * Cấu hình kết nối Postgres.
 * - Từ B03 `synchronize` luôn tắt; schema đi theo migration.
 * - `migrationsRun`: ngoài production, ứng dụng tự chạy migration còn thiếu khi khởi động (tiện cho dev/test). Production KHÔNG tự chạy:
 *   nhiều bản ứng dụng khởi động cùng lúc sẽ đua nhau áp dụng migration; chạy một lần như một bước riêng của deploy (`npm run migration:run`).
 * - `retryAttempts/retryDelay`: mặc định của @nestjs/typeorm là 10 lần cách 3 s (treo 30 s khi sai URL); ngoài production thất bại nhanh.
 */
export const databaseConfig = registerAs('database', () => {
  const env = loadEnv();
  const production = env.NODE_ENV === 'production';
  return {
    url: env.DATABASE_URL,
    synchronize: false as const,
    migrationsRun: !production,
    logging: env.DB_LOGGING,
    retryAttempts: production ? 10 : 3,
    retryDelay: production ? 3000 : 500,
  };
});
