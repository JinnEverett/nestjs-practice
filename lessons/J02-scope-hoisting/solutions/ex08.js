// ex08 · createConfig — đáp án best practice
//
// - Hàm thuần nhận `env` làm tham số (dependency injection mức nhỏ nhất) → test được mà không cần
//   sửa process.env. Lúc chạy thật: `export const config = createConfig(process.env);` ở module scope,
//   đọc MỘT lần khi khởi động.
// - Validate từng biến và "fail fast" với thông điệp nói rõ biến nào sai.
// - `Number` + `Number.isInteger` + khoảng hợp lệ (không dùng parseInt: '12abc' → 12).
// - `Object.freeze` → mọi chỗ khác chỉ đọc được; gán nhầm sẽ ném TypeError (strict mode) thay vì âm thầm đổi config.
export function createConfig(env) {
  const port = env.PORT === undefined ? 3000 : Number(env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${env.PORT}`);
  }

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');

  const nodeEnv = env.NODE_ENV ?? 'development';

  return Object.freeze({
    port,
    databaseUrl,
    nodeEnv,
    isProduction: nodeEnv === 'production',
  });
}
