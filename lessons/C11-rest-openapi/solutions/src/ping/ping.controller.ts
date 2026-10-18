import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClockService } from '../clock/clock.service';

@ApiTags('system')
@Controller('ping')
export class PingController {
  constructor(private readonly clock: ClockService) {}

  @Get()
  @ApiOperation({ summary: 'Kiểm tra sống' })
  @ApiOkResponse({ schema: { type: 'object', properties: { pong: { type: 'boolean', example: true }, time: { type: 'string', format: 'date-time' } }, required: ['pong', 'time'] } })
  ping() {
    return { pong: true, time: this.clock.now().toISOString() };
  }
}
