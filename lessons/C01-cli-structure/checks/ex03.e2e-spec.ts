import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClockModule } from '../../src/clock/clock.module';
import { ClockService } from '../../src/clock/clock.service';
import { createTestApp, http, readSource } from './_kit';

const FIXED = new Date('2026-10-17T08:00:00.000Z');

describe('C01 ex03 · DI với ClockService', () => {
  let app: INestApplication;
  afterEach(async () => {
    await app?.close();
  });

  it('thay ClockService bằng bản giả → /ping trả giờ giả', async () => {
    app = await createTestApp({
      customize: (b) => b.overrideProvider(ClockService).useValue({ now: () => FIXED }),
    });
    const res = await http(app).get('/ping').expect(200);
    expect(res.body).toEqual({ pong: true, time: '2026-10-17T08:00:00.000Z' });
  });

  it('không override: time là ISO 8601 hợp lệ, gần thời điểm hiện tại', async () => {
    app = await createTestApp();
    const before = Date.now();
    const res = await http(app).get('/ping').expect(200);
    expect(res.body.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    const t = Date.parse(res.body.time);
    expect(Math.abs(t - before)).toBeLessThan(2000);
  });

  it('ClockModule cung cấp và export ClockService (singleton)', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ClockModule] }).compile();
    const a = moduleRef.get(ClockService);
    expect(a).toBeInstanceOf(ClockService);
    expect(a.now()).toBeInstanceOf(Date);
    expect(moduleRef.get(ClockService)).toBe(a);
  });

  it('controller không tự gọi new Date()/Date.now() (phải qua ClockService)', () => {
    const src = readSource('src', 'ping', 'ping.controller.ts');
    expect(src).not.toMatch(/new Date\(|Date\.now\(/);
    expect(src).toMatch(/ClockService/);
  });
});
