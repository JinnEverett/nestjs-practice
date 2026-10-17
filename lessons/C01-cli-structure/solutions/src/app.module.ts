import { Module } from '@nestjs/common';
import { ClockModule } from './clock/clock.module';
import { PingController } from './ping/ping.controller';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [ClockModule, ProductsModule],
  controllers: [PingController],
})
export class AppModule {}
