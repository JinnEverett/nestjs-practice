import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ProblemDetailsDto } from './problem-details.dto';

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Shop API')
    .setDescription('API bán hàng của khóa học NestJS. Lỗi luôn là application/problem+json (RFC 9457).')
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', name: 'X-Api-Key', in: 'header' }, 'ApiKey')
    .addTag('products', 'Danh mục sản phẩm')
    .addTag('orders', 'Đặt hàng')
    .addTag('system', 'Kiểm tra sống')
    .build();
  return SwaggerModule.createDocument(app, config, {
    extraModels: [ProblemDetailsDto],
    operationIdFactory: (controllerKey: string, methodKey: string, version?: string) =>
      `${controllerKey.replace(/Controller$/, "")}_${methodKey}${version ? `_${version}` : ""}`,
  });
}

export function setupSwagger(app: INestApplication): OpenAPIObject {
  const document = buildOpenApiDocument(app);
  // Đường dẫn không có tiền tố phiên bản: /docs (giao diện) và /docs-json (đặc tả).
  SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs-json' });
  return document;
}
