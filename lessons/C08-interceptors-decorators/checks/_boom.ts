import { Controller, Get, INestApplication, NotFoundException, Post } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { AdminOnly } from '../../src/common/decorators/admin-only.decorator';
import { ReqId } from '../../src/common/decorators/req-id.decorator';
import { CacheTtl } from '../../src/common/interceptors/get-cache.interceptor';
import { Timeout } from '../../src/common/interceptors/timeout.interceptor';

export const counters = { cached: 0, slowFinished: 0 };

@Controller('boom')
export class BoomController {
  @Get('rid')
  rid(@ReqId() id: string | undefined) {
    return { id };
  }
  @Get('slow')
  @Timeout(50)
  async slow() {
    await new Promise((r) => setTimeout(r, 300));
    counters.slowFinished++;
    return { done: true };
  }
  @Get('fast')
  @Timeout(50)
  fast() {
    return { done: true };
  }
  @Get('err')
  @Timeout(50)
  err(): never {
    throw new NotFoundException('không có');
  }
  @Post('admin')
  @AdminOnly()
  admin() {
    return { ok: true };
  }
  @Get('cached')
  @CacheTtl(10)
  cached() {
    return { n: ++counters.cached };
  }
  @Get('uncached')
  uncached() {
    return { n: ++counters.cached };
  }
  @Get('cached-404')
  @CacheTtl(10)
  cached404(): never {
    counters.cached++;
    throw new NotFoundException('x');
  }
  @Post('write')
  write() {
    return { ok: true };
  }
}

export async function createAppWithBoom(customize?: (b: TestingModuleBuilder) => TestingModuleBuilder): Promise<INestApplication> {
  let builder = Test.createTestingModule({ imports: [AppModule], controllers: [BoomController] });
  if (customize) builder = customize(builder);
  const ref = await builder.compile();
  const app = ref.createNestApplication();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  await require('../../src/app.setup').configureApp(app);
  await app.init();
  return app;
}
