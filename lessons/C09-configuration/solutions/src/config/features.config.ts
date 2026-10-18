import { registerAs } from '@nestjs/config';
import { loadEnv } from './env';

export const featuresConfig = registerAs('features', () => ({ debugEndpoints: loadEnv().DEBUG_ENDPOINTS }));
