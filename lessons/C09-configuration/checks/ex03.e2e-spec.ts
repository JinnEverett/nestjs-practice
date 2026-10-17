import { bootWith, errorText } from './_cfg';

describe('C09 ex03 · kiểm tra env khi khởi động, báo MỌI lỗi một lượt', () => {
  it.each([
    [{ PORT: 'abc' }, 'PORT'],
    [{ PORT: '0' }, 'PORT'],
    [{ PORT: '70000' }, 'PORT'],
    [{ PORT: '30.5' }, 'PORT'],
    [{ NODE_ENV: 'staging' }, 'NODE_ENV'],
    [{ DATABASE_URL: 'mysql://root@localhost/x' }, 'DATABASE_URL'],
    [{ DATABASE_URL: 'localhost:5432' }, 'DATABASE_URL'],
    [{ REDIS_URL: 'http://localhost:6379' }, 'REDIS_URL'],
    [{ DEBUG_ENDPOINTS: 'yes' }, 'DEBUG_ENDPOINTS'],
    [{ DEBUG_ENDPOINTS: '1' }, 'DEBUG_ENDPOINTS'],
    [{ SHIPPING_FEE: '-1' }, 'SHIPPING_FEE'],
    [{ SHIPPING_FEE: '1.5' }, 'SHIPPING_FEE'],
    [{ FREE_SHIPPING_THRESHOLD: 'rất nhiều' }, 'FREE_SHIPPING_THRESHOLD'],
  ])('%j → app không khởi động và thông báo nêu %s', async (env, name) => {
    const msg = await errorText(bootWith(env as Record<string, string>));
    expect(msg).not.toBe('');
    expect(msg).toContain(name);
  });

  it('nhiều lỗi cùng lúc: thông báo liệt kê TẤT CẢ biến sai', async () => {
    const msg = await errorText(bootWith({ PORT: 'abc', SHIPPING_FEE: '-5', DEBUG_ENDPOINTS: 'maybe', REDIS_URL: 'nope' }));
    for (const name of ['PORT', 'SHIPPING_FEE', 'DEBUG_ENDPOINTS', 'REDIS_URL']) expect(msg).toContain(name);
  });

  it('cấu hình hợp lệ thì khởi động bình thường', async () => {
    const app = await bootWith({ PORT: '8080', DEBUG_ENDPOINTS: 'false', SHIPPING_FEE: '0' });
    await app.close();
  });
});
