import { INestApplication, VersioningType } from '@nestjs/common';

/** Cấu hình dùng chung cho main.ts và test e2e. Các module sau thêm pipe/filter/prefix... vào đây. */
export function configureApp(app: INestApplication): void {
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.enableShutdownHooks();
  // Versioning kiểu URI: controller nào khai báo `version` thì route nằm dưới /v<version>/...
  // Không đặt defaultVersion để /ping vẫn nằm ngoài phiên bản.
  app.enableVersioning({ type: VersioningType.URI });
}
