import { registerAs } from '@nestjs/config';
import { loadEnv } from './env';

export const authConfig = registerAs('auth', () => {
  const env = loadEnv();
  return { accessSecret: env.JWT_ACCESS_SECRET, refreshSecret: env.JWT_REFRESH_SECRET, adminApiKey: env.ADMIN_API_KEY };
});
