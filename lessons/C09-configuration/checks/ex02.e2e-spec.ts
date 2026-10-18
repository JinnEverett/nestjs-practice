import { INestApplication } from '@nestjs/common';
import { bootWith, configOf } from './_cfg';

const get = <T>(app: INestApplication, token: string): T => app.get<T>(token, { strict: false });

describe('C09 ex02 · registerAs: cấu hình theo namespace, có kiểu', () => {
  it('giá trị mặc định khi chạy test (NODE_ENV=test)', async () => {
    const app = await bootWith({});
    try {
      expect(get(app, 'CONFIGURATION(app)')).toEqual({ nodeEnv: 'test', port: 3000, isProduction: false });
      expect(get<{ url: string }>(app, 'CONFIGURATION(database)').url).toBe('postgres://postgres:postgres@localhost:5434/shop_test');
      expect(get(app, 'CONFIGURATION(redis)')).toEqual({ url: 'redis://localhost:6380' });
      expect(get(app, 'CONFIGURATION(features)')).toEqual({ debugEndpoints: false });
      expect(get(app, 'CONFIGURATION(pricing)')).toEqual({ shippingFee: 30000, freeShippingThreshold: 500000 });
      const auth = get<{ adminApiKey: string; accessSecret: string; refreshSecret: string }>(app, 'CONFIGURATION(auth)');
      expect(auth.adminApiKey).toBe('dev-admin-key');
      expect(auth.accessSecret.length).toBeGreaterThanOrEqual(32);
      expect(auth.refreshSecret).not.toBe(auth.accessSecret);
    } finally {
      await app.close();
    }
  });

  it('env được chuyển KIỂU: PORT là number, DEBUG_ENDPOINTS là boolean ("false" không thành true)', async () => {
    const on = await bootWith({ PORT: '4000', DEBUG_ENDPOINTS: 'true', SHIPPING_FEE: '15000', FREE_SHIPPING_THRESHOLD: '99000' });
    try {
      expect(get(on, 'CONFIGURATION(app)')).toMatchObject({ port: 4000 });
      expect(get(on, 'CONFIGURATION(features)')).toEqual({ debugEndpoints: true });
      expect(get(on, 'CONFIGURATION(pricing)')).toEqual({ shippingFee: 15000, freeShippingThreshold: 99000 });
    } finally {
      await on.close();
    }
    const off = await bootWith({ DEBUG_ENDPOINTS: 'false' });
    try {
      expect(get(off, 'CONFIGURATION(features)')).toEqual({ debugEndpoints: false });
    } finally {
      await off.close();
    }
  });

  it('biến để trống (PORT=) coi như chưa đặt → dùng mặc định', async () => {
    const app = await bootWith({ PORT: '', SHIPPING_FEE: '' });
    try {
      expect(get(app, 'CONFIGURATION(app)')).toMatchObject({ port: 3000 });
      expect(get(app, 'CONFIGURATION(pricing)')).toMatchObject({ shippingFee: 30000 });
    } finally {
      await app.close();
    }
  });

  it('ConfigService đọc được theo đường dẫn "namespace.khóa"', async () => {
    const app = await bootWith({ PORT: '4321' });
    try {
      const config = configOf(app);
      expect(config.get('app.port')).toBe(4321);
      expect(config.get('pricing.shippingFee')).toBe(30000);
    } finally {
      await app.close();
    }
  });
});
