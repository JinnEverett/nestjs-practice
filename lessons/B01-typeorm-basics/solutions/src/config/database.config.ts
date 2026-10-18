import { registerAs } from '@nestjs/config';
import { loadEnv } from './env';

/**
 * Cấu hình kết nối Postgres. Chỉ đọc từ `loadEnv()` (đã được kiểm tra), không đọc `process.env` rải rác.
 * - `synchronize`: để TypeORM tự đồng bộ schema theo entity. Tiện khi phát triển/test, **không bao giờ** bật ở production
 *   (nó có thể ĐỔI và XÓA cột/bảng để cho khớp entity). Từ B03 schema đi theo migration.
 * - `retryAttempts/retryDelay`: mặc định của @nestjs/typeorm là 10 lần cách 3 s, tức treo 30 s khi sai URL. Ngoài production
 *   thất bại nhanh (3 × 0,5 s) để lỗi cấu hình hiện ra ngay; production chờ DB dậy lâu hơn.
 */
export const databaseConfig = registerAs('database', () => {
  const env = loadEnv();
  const production = env.NODE_ENV === 'production';
  return {
    url: env.DATABASE_URL,
    synchronize: !production,
    logging: env.DB_LOGGING,
    retryAttempts: production ? 10 : 3,
    retryDelay: production ? 3000 : 500,
  };
});
