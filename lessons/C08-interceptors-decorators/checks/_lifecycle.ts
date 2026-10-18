// Mã của bài 🔮 ex07 (giống hệt trong exercises.md). Check chạy thật để lấy thứ tự đúng.
import {
  CallHandler, CanActivate, Controller, ExecutionContext, Get, Injectable, NestInterceptor, PipeTransform, Query, UseGuards,
  UseInterceptors, UsePipes,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { tap } from 'rxjs';
import request from 'supertest';

export async function runLifecycle(): Promise<string[]> {
  const log: string[] = [];
  const mark = (s: string) => void log.push(s);

  const guard = (name: string) => {
    @Injectable()
    class G implements CanActivate {
      canActivate() {
        mark(`guard:${name}`);
        return true;
      }
    }
    return G;
  };
  const interceptor = (name: string) => {
    @Injectable()
    class I implements NestInterceptor {
      intercept(_c: ExecutionContext, next: CallHandler) {
        mark(`int:${name}:before`);
        return next.handle().pipe(tap(() => mark(`int:${name}:after`)));
      }
    }
    return I;
  };
  const pipe = (name: string) => {
    @Injectable()
    class P implements PipeTransform {
      transform(v: unknown) {
        mark(`pipe:${name}`);
        return v;
      }
    }
    return P;
  };
  const GlobalGuard = guard('global'), ControllerGuard = guard('controller'), RouteGuard = guard('route');
  const GlobalInt = interceptor('global'), ControllerInt = interceptor('controller'), RouteInt = interceptor('route');
  const GlobalPipe = pipe('global'), RoutePipe = pipe('route'), ParamPipe = pipe('param');

  @Controller('x')
  @UseGuards(ControllerGuard)
  @UseInterceptors(ControllerInt)
  class X {
    @Get()
    @UseGuards(RouteGuard)
    @UseInterceptors(RouteInt)
    @UsePipes(RoutePipe)
    handle(@Query('a', ParamPipe) _a: string) {
      mark('handler');
      return { ok: true };
    }
  }

  const ref = await Test.createTestingModule({ controllers: [X] }).compile();
  const app = ref.createNestApplication();
  app.use((_q: unknown, _r: unknown, next: () => void) => {
    mark('middleware');
    next();
  });
  app.useGlobalGuards(new GlobalGuard());
  app.useGlobalInterceptors(new GlobalInt());
  app.useGlobalPipes(new GlobalPipe());
  await app.init();
  await request(app.getHttpServer()).get('/x?a=1').expect(200);
  await app.close();
  return log;
}
