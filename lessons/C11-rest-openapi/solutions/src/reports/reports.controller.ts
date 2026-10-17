import { Controller, Get } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';
import { ApiExcludeController } from '@nestjs/swagger';
import { ReportsModule } from './reports.module';
import { ReportsService } from './reports.service';

@ApiExcludeController()
@Controller({ path: '_reports', version: '1' })
export class ReportsController {
  constructor(private readonly lazyLoader: LazyModuleLoader) {}

  @Get('summary')
  async summary() {
    // load() chỉ dựng module lần đầu, các lần sau trả lại module đã nạp.
    const moduleRef = await this.lazyLoader.load(() => ReportsModule);
    return moduleRef.get(ReportsService).summary();
  }
}
