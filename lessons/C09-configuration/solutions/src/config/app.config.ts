import { registerAs } from '@nestjs/config';
import { loadEnv } from './env';

export const appConfig = registerAs('app', () => {
  const env = loadEnv();
  return { nodeEnv: env.NODE_ENV, port: env.PORT, isProduction: env.NODE_ENV === 'production' };
});
