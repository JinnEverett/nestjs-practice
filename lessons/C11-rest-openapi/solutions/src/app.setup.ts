import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { setupSwagger } from './common/swagger/setup-swagger';
import { flattenValidationErrors, ValidationFailedException } from './common/errors/validation-failed.exception';

/** Cấu hình dùng chung cho main.ts và test e2e. Các module sau thêm prefix/Swagger... vào đây. */
export function configureApp(app: INestApplication): void {
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.enableShutdownHooks();
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => new ValidationFailedException(flattenValidationErrors(errors)),
    }),
  );
  // Filter toàn cục được đăng ký bằng APP_FILTER trong AppModule (để có DI), không phải ở đây.
  setupSwagger(app); // /docs và /docs-json, nằm ngoài tiền tố phiên bản
}
