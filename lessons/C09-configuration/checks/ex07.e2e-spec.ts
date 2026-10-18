import { readFileSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { bootWith, errorText, PROD_OK } from './_cfg';
import { repoPath } from './_kit';
import { http } from './_kit';

describe('C09 ex07 · 🔴 "Secret nằm trong log khởi động"', () => {
  it('thông báo lỗi cấu hình không in giá trị của biến nào (kể cả bí mật gõ sai)', async () => {
    const secret = ['sk', 'live', 'TopSecretValueThatIsTooShort'].join('_');
    const msg = await errorText(
      bootWith({ ...PROD_OK, JWT_ACCESS_SECRET: 'ngan', ADMIN_API_KEY: secret.slice(0, 8), DATABASE_URL: 'mysql://user:p4ssw0rd@db/x', PORT: 'cong-sai-abc' }),
    );
    expect(msg).toContain('JWT_ACCESS_SECRET');
    for (const leak of ['p4ssw0rd', 'mysql://', 'cong-sai-abc', ['sk', 'live_T'].join('_'), 'ngan"']) expect({ leak, found: msg.includes(leak) }).toEqual({ leak, found: false });
  });

  it('khởi động thành công không in cấu hình hay bí mật ra bất kỳ log nào', async () => {
    const seen: string[] = [];
    const spies = (['log', 'warn', 'error', 'debug', 'verbose'] as const).map((lv) =>
      jest.spyOn(Logger.prototype, lv).mockImplementation((...a: unknown[]) => void seen.push(a.map(String).join(' '))),
    );
    const spyConsole = jest.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void seen.push(a.map(String).join(' ')));
    try {
      const app = await bootWith(PROD_OK);
      await http(app).get('/ping');
      await app.close();
    } finally {
      spies.forEach((s) => s.mockRestore());
      spyConsole.mockRestore();
    }
    const all = seen.join('\n');
    for (const v of [PROD_OK.JWT_ACCESS_SECRET, PROD_OK.JWT_REFRESH_SECRET, PROD_OK.ADMIN_API_KEY, 'db.internal', 'pw@']) {
      expect({ v: v.slice(0, 6), leaked: all.includes(v) }).toEqual({ v: v.slice(0, 6), leaked: false });
    }
  });

  it('production không bao giờ dùng khóa/bí mật mặc định dù gửi khóa mặc định lên', async () => {
    const app = await bootWith(PROD_OK);
    try {
      const body = { sku: 'PD-1', name: 'x', price: 1 };
      await http(app).post('/v1/products').set('x-api-key', 'dev-admin-key').send(body).expect(401);
      await http(app).post('/v1/products').set('x-api-key', PROD_OK.ADMIN_API_KEY).send(body).expect(201);
    } finally {
      await app.close();
    }
  });

  it('.env thật không nằm trong repo; .env.example không chứa chuỗi trông như bí mật thật (>= 32 ký tự ngẫu nhiên)', () => {
    const text = readFileSync(repoPath('.env.example'), 'utf8');
    for (const m of text.matchAll(/^(?:JWT_[A-Z_]+|ADMIN_API_KEY)=([^\s#]+)/gm)) {
      const v = m[1];
      expect({ v, random: v.length >= 32 && !/change-?me|example/i.test(v) }).toEqual({ v, random: false });
    }
  });
});
