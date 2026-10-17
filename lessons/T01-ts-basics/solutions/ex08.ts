// ex08 · loadConfig — đáp án best practice
//
// - NODE_ENVS `as const` + type guard → thu hẹp chuỗi thành union mà không cần `as`.
// - Thu thập lỗi vào mảng, ném MỘT lần → DevOps sửa hết cấu hình sai trong một lần deploy.
// - Biến trung gian có kiểu `number | undefined` → sau khi kiểm lỗi, dùng an toàn.
// - Trả Readonly<AppConfig> + Object.freeze: chặn sửa cả lúc biên dịch lẫn lúc chạy.
// Trong NestJS: ConfigModule.forRoot({ validate }) hoặc validationSchema (Joi/zod) — C09.
export interface AppConfig {
  port: number;
  databaseUrl: string;
  nodeEnv: 'development' | 'production' | 'test';
  corsOrigins: string[];
}

const NODE_ENVS = ['development', 'production', 'test'] as const;
const isNodeEnv = (v: string): v is AppConfig['nodeEnv'] => (NODE_ENVS as readonly string[]).includes(v);

export function loadConfig(env: Record<string, string | undefined>): Readonly<AppConfig> {
  const errors: string[] = [];

  const port = env.PORT === undefined ? 3000 : Number(env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push(`PORT must be an integer 1-65535, got "${env.PORT}"`);

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) errors.push('DATABASE_URL is required');

  const rawEnv = env.NODE_ENV ?? 'development';
  if (!isNodeEnv(rawEnv)) errors.push(`NODE_ENV must be one of ${NODE_ENVS.join(', ')}, got "${rawEnv}"`);

  if (errors.length > 0 || !databaseUrl || !isNodeEnv(rawEnv)) {
    throw new Error(`Invalid configuration:\n- ${errors.join('\n- ')}`);
  }

  const corsOrigins = (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');

  return Object.freeze({ port, databaseUrl, nodeEnv: rawEnv, corsOrigins });
}
