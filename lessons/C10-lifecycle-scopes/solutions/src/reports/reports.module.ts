import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { ReportsService } from './reports.service';

/** KHÔNG import vào AppModule: được nạp lười bằng LazyModuleLoader ở lần gọi đầu tiên. */
@Module({ imports: [ProductsModule], providers: [ReportsService] })
export class ReportsModule {}
