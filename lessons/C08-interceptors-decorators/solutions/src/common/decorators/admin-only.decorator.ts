import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../guards/api-key.guard';

export const IS_ADMIN_ONLY = 'isAdminOnly';

/** Gộp guard + metadata: một decorator thay cho @UseGuards(ApiKeyGuard) rải khắp nơi. Metadata để A04 (RolesGuard) và Swagger (C11) đọc. */
export const AdminOnly = () => applyDecorators(SetMetadata(IS_ADMIN_ONLY, true), UseGuards(ApiKeyGuard));
