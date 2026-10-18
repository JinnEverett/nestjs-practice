import { Controller, Get, HttpException, INestApplication, Post, ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { OutOfStockError } from '../../src/common/errors/domain-errors';

/** Controller thử nghiệm: ném đủ loại lỗi để kiểm filter. Gắn vào AppModule thật qua `controllers` của module gốc test. */
@Controller('boom')
export class BoomController {
  @Get('error')
  error(): never {
    throw new Error('connect ECONNREFUSED 10.0.0.5:5432 password=hunter2');
  }
  @Get('string')
  str(): never {
    throw 'oops-secret'; // eslint-disable-line @typescript-eslint/only-throw-error
  }
  @Get('null')
  nul(): never {
    throw null; // eslint-disable-line @typescript-eslint/only-throw-error
  }
  @Get('503')
  unavailable(): never {
    throw new ServiceUnavailableException('db pool exhausted at host db-internal-7');
  }
  @Get('teapot')
  teapot(): never {
    throw new HttpException({ message: ['uống trà', 'đi ngủ'], code: 'X' }, 418);
  }
  @Get('stock')
  stock(): never {
    throw new OutOfStockError(7, 5, 2);
  }
  @Post('echo')
  echo(): { ok: true } {
    return { ok: true };
  }
}

export async function createAppWithBoom(): Promise<INestApplication> {
  const ref = await Test.createTestingModule({ imports: [AppModule], controllers: [BoomController] }).compile();
  const app = ref.createNestApplication();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  await require('../../src/app.setup').configureApp(app);
  await app.init();
  return app;
}
