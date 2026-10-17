import { registerAs } from '@nestjs/config';
import { loadEnv } from './env';

export const databaseConfig = registerAs('database', () => ({ url: loadEnv().DATABASE_URL }));
