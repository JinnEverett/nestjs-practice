import { Module } from '@nestjs/common';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ProductsModule } from '../products/products.module';
import { ExportsController } from './exports.controller';
import { ProductImagesController } from './product-images.controller';
import { ProductImagesService } from './product-images.service';
import { UPLOAD_DIR } from './upload.tokens';

@Module({
  imports: [ProductsModule],
  controllers: [ProductImagesController, ExportsController],
  providers: [ProductImagesService, { provide: UPLOAD_DIR, useValue: join(tmpdir(), 'shop-api-uploads') }],
  exports: [ProductImagesService],
})
export class UploadsModule {}
