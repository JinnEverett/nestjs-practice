import { INestApplication } from '@nestjs/common';

/** Cấu hình dùng chung cho main.ts và test e2e. Các module sau thêm pipe/filter/prefix... vào đây. */
export function configureApp(app: INestApplication): void {
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.enableShutdownHooks();
}
