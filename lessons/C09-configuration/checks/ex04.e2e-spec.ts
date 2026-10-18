import { bootWith, errorText, PROD_OK } from './_cfg';

describe('C09 ex04 · production nghiêm ngặt, môi trường khác có mặc định', () => {
  it('production đủ biến hợp lệ → khởi động được', async () => {
    const app = await bootWith(PROD_OK);
    try {
      expect(app.get('CONFIGURATION(app)', { strict: false })).toMatchObject({ nodeEnv: 'production', isProduction: true });
      expect(app.get('CONFIGURATION(features)', { strict: false })).toEqual({ debugEndpoints: false });
    } finally {
      await app.close();
    }
  });

  it.each(['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'ADMIN_API_KEY', 'DATABASE_URL'])(
    'production thiếu %s → không khởi động (không dùng mặc định dev)',
    async (missing) => {
      const env = { ...PROD_OK };
      delete env[missing];
      expect(await errorText(bootWith(env))).toContain(missing);
    },
  );

  it('production thiếu NHIỀU biến: nêu tất cả', async () => {
    const msg = await errorText(bootWith({ NODE_ENV: 'production' }));
    for (const name of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'ADMIN_API_KEY', 'DATABASE_URL']) expect(msg).toContain(name);
  });

  it('bí mật quá ngắn (< 32) hoặc khóa admin < 16 ký tự ở production → từ chối', async () => {
    expect(await errorText(bootWith({ ...PROD_OK, JWT_ACCESS_SECRET: 'short' }))).toContain('JWT_ACCESS_SECRET');
    expect(await errorText(bootWith({ ...PROD_OK, JWT_REFRESH_SECRET: 'x'.repeat(31) }))).toContain('JWT_REFRESH_SECRET');
    expect(await errorText(bootWith({ ...PROD_OK, ADMIN_API_KEY: 'abc123' }))).toContain('ADMIN_API_KEY');
  });

  it('hai bí mật JWT giống nhau → từ chối', async () => {
    const same = 'S'.repeat(40);
    expect(await errorText(bootWith({ ...PROD_OK, JWT_ACCESS_SECRET: same, JWT_REFRESH_SECRET: same }))).toContain('JWT_REFRESH_SECRET');
  });

  it('DEBUG_ENDPOINTS=true ở production → từ chối', async () => {
    expect(await errorText(bootWith({ ...PROD_OK, DEBUG_ENDPOINTS: 'true' }))).toContain('DEBUG_ENDPOINTS');
  });

  it('development và test không bắt buộc biến nào (mặc định an toàn cho máy dev)', async () => {
    for (const NODE_ENV of ['development', 'test']) {
      const app = await bootWith({ NODE_ENV });
      await app.close();
    }
    const dev = await bootWith({ NODE_ENV: 'development' });
    try {
      expect(dev.get<{ url: string }>('CONFIGURATION(database)', { strict: false }).url).toMatch(/\/shop_dev$/);
    } finally {
      await dev.close();
    }
  });

  it('NODE_ENV không đặt → coi là development', async () => {
    const app = await bootWith({ NODE_ENV: undefined as unknown as string });
    await app.close();
  });
});
