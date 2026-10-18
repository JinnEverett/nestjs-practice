import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TraceController } from './trace.controller';
import { TraceMiddleware } from './trace.parts';

@Module({ controllers: [TraceController] })
export class TraceModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TraceMiddleware).forRoutes(TraceController);
  }
}
