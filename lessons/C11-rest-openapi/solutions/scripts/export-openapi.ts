// Xuất đặc tả OpenAPI ra file để commit và so sánh trong CI (phát hiện thay đổi contract ngoài ý muốn).
//   npx ts-node scripts/export-openapi.ts [đường-dẫn-ra]      (mặc định: openapi.json ở gốc shop-api)
import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'node:fs';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { buildOpenApiDocument } from '../src/common/swagger/setup-swagger';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  configureApp(app);
  await app.init();
  const out = process.argv[2] ?? 'openapi.json';
  writeFileSync(out, JSON.stringify(buildOpenApiDocument(app), null, 2) + '\n');
  await app.close();
  console.log(`Đã ghi ${out}`);
}
void main();
