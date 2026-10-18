import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';

export const IS_ADMIN_ONLY = 'isAdminOnly';

/** Guard + metadata + tài liệu (security scheme ApiKey, response 401) trong một decorator. */
export const AdminOnly = () =>
  applyDecorators(
    SetMetadata(IS_ADMIN_ONLY, true),
    UseGuards(ApiKeyGuard),
    ApiSecurity('ApiKey'),
    ApiResponse({
      status: 401,
      description: 'Thiếu hoặc sai X-Api-Key',
      content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/ProblemDetailsDto' } } },
    }),
  );
