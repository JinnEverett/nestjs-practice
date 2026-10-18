import { plainToInstance, Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsString, Matches, Max, Min, MinLength, validateSync } from 'class-validator';

const NODE_ENVS = ['development', 'test', 'production'] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];

/** Biến môi trường luôn là chuỗi: đổi sang số/boolean tường minh (Boolean('false') === true!). */
const toInt = ({ value }: TransformFnParams): unknown => (typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? Number(value) : value);
const toBool = ({ value }: TransformFnParams): unknown => (value === 'true' ? true : value === 'false' ? false : value);

const URL_RE = (scheme: string) => new RegExp(`^${scheme}://\\S+$`);

export class Env {
  @IsIn(NODE_ENVS) NODE_ENV: NodeEnv = 'development';

  @Transform(toInt) @IsInt() @Min(1) @Max(65535) PORT: number = 3000;

  @Matches(URL_RE('postgres(ql)?'), { message: 'DATABASE_URL phải bắt đầu bằng postgres:// hoặc postgresql://' })
  DATABASE_URL!: string;

  @Matches(URL_RE('rediss?'), { message: 'REDIS_URL phải bắt đầu bằng redis:// hoặc rediss://' })
  REDIS_URL: string = 'redis://localhost:6380';

  @IsString() @MinLength(32) JWT_ACCESS_SECRET!: string;
  @IsString() @MinLength(32) JWT_REFRESH_SECRET!: string;

  @IsString() @MinLength(8) ADMIN_API_KEY!: string;

  @Transform(toBool) @IsBoolean() DEBUG_ENDPOINTS: boolean = false;

  /** Ghi mọi câu SQL ra log (chỉ nên bật khi điều tra: lộ tham số và tốn I/O). */
  @Transform(toBool) @IsBoolean() DB_LOGGING: boolean = false;

  @Transform(toInt) @IsInt() @Min(0) SHIPPING_FEE: number = 30_000;
  @Transform(toInt) @IsInt() @Min(0) FREE_SHIPPING_THRESHOLD: number = 500_000;
}

const DEV_DEFAULTS = {
  JWT_ACCESS_SECRET: 'dev-access-secret-not-for-production-0001',
  JWT_REFRESH_SECRET: 'dev-refresh-secret-not-for-production-02',
  ADMIN_API_KEY: 'dev-admin-key',
};

export class EnvValidationError extends Error {
  constructor(readonly problems: string[]) {
    super(`Cấu hình môi trường không hợp lệ:\n${problems.map((p) => ` - ${p}`).join('\n')}`);
    this.name = 'EnvValidationError';
  }
}

/**
 * Kiểm tra và chuẩn hóa biến môi trường. Báo TẤT CẢ lỗi một lượt, không bao giờ in giá trị (có thể là bí mật).
 * Mặc định cho bí mật chỉ tồn tại ngoài production.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const input: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) if (v !== '' && v !== undefined) input[k] = v; // rỗng = chưa đặt

  const nodeEnv = (input.NODE_ENV as string | undefined) ?? 'development';
  const prod = nodeEnv === 'production';
  if (!prod) {
    Object.assign(input, { ...DEV_DEFAULTS, ...input });
    input.DATABASE_URL ??= `postgres://postgres:postgres@localhost:5434/${nodeEnv === 'test' ? 'shop_test' : 'shop_dev'}`;
  }

  const env = plainToInstance(Env, input, { exposeUnsetFields: false });
  const errors = validateSync(env, { skipMissingProperties: false, whitelist: false });
  const problems = errors.flatMap((e) =>
    Object.values(e.constraints ?? {}).map((m) => (m.startsWith(e.property) ? m : `${e.property}: ${m}`)),
  );

  if (prod) {
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'ADMIN_API_KEY', 'DATABASE_URL'] as const) {
      if (input[key] === undefined && !problems.some((p) => p.startsWith(key))) problems.push(`${key}: bắt buộc ở production`);
    }
    if (input.ADMIN_API_KEY !== undefined && String(input.ADMIN_API_KEY).length < 16) {
      problems.push('ADMIN_API_KEY: ở production phải dài ít nhất 16 ký tự');
    }
    if (input.JWT_ACCESS_SECRET !== undefined && input.JWT_ACCESS_SECRET === input.JWT_REFRESH_SECRET) {
      problems.push('JWT_REFRESH_SECRET: phải khác JWT_ACCESS_SECRET');
    }
    if (env.DEBUG_ENDPOINTS === true) problems.push('DEBUG_ENDPOINTS: không được bật ở production');
  }
  if (problems.length > 0) throw new EnvValidationError([...new Set(problems)]);
  return env;
}

export const loadEnv = (): Env => validateEnv(process.env);
