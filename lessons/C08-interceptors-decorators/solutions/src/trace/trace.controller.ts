import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { record, TraceGuard, TraceInterceptor, TracePipe } from './trace.parts';

@Controller({ path: '_trace', version: '1' })
@UseGuards(TraceGuard)
@UseInterceptors(TraceInterceptor)
export class TraceController {
  @Get()
  trace(@Query('n', TracePipe) n: number) {
    return { n, order: [...record('handler')] };
  }
}
