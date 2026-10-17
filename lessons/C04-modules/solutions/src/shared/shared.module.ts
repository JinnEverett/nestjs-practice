import { Global, Module } from '@nestjs/common';
import { ClockModule } from '../clock/clock.module';

/** Những thứ gần như module nào cũng cần (giờ hệ thống). @Global: khỏi `imports` ở từng nơi. Dùng dè sẻn. */
@Global()
@Module({
  imports: [ClockModule],
  exports: [ClockModule],
})
export class SharedModule {}
