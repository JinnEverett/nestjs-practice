import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

const DESCRIPTIONS: Record<number, string> = {
  400: 'Dữ liệu không hợp lệ (type validation hoặc bad-request)',
  401: 'Thiếu hoặc sai X-Api-Key',
  404: 'Không tìm thấy',
  408: 'Xử lý quá thời gian',
  409: 'Xung đột (out-of-stock, duplicate-sku, conflict)',
  410: 'API đã ngừng',
  422: 'Vi phạm quy tắc nghiệp vụ',
};

/** Khai báo các lỗi problem+json mà route có thể trả. Dùng: @ApiProblems(400, 404). */
export const ApiProblems = (...statuses: number[]) =>
  applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: DESCRIPTIONS[status] ?? 'Lỗi',
        content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/ProblemDetailsDto' } } },
      }),
    ),
    ApiResponse({
      status: 500,
      description: 'Lỗi hệ thống (không lộ chi tiết)',
      content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/ProblemDetailsDto' } } },
    }),
  );
