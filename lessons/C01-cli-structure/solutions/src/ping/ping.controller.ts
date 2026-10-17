import { Controller, Get } from '@nestjs/common';
import { ClockService } from '../clock/clock.service';

@Controller('ping')
export class PingController {
  constructor(private readonly clock: ClockService) {}

  @Get()
  ping() {
    return { pong: true, time: this.clock.now().toISOString() };
  }
}
