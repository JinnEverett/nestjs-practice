import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';

/** Cấu hình dùng chung cho main.ts và test e2e. Các module sau thêm filter/prefix/Swagger... vào đây. */
export function configureApp(app: INestApplication): void {
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.enableShutdownHooks();
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // bỏ field không có decorator
      forbidNonWhitelisted: true, // ...và báo 400 thay vì lặng lẽ bỏ
      transform: true, // trả về instance của DTO với kiểu đã chuyển
    }),
  );
}
