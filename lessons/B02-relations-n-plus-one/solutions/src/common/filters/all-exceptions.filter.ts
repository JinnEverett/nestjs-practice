import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { STATUS_CODES } from 'node:http';
import { DomainError } from '../errors/domain-errors';
import { FieldError, ValidationFailedException } from '../errors/validation-failed.exception';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: FieldError[];
  [extension: string]: unknown;
}

const TYPE_PREFIX = 'urn:shop:error:';

const CODE_BY_STATUS: Record<number, string> = {
  400: 'bad-request', 401: 'unauthorized', 403: 'forbidden', 404: 'not-found', 405: 'method-not-allowed',
  408: 'request-timeout', 409: 'conflict', 410: 'gone', 413: 'payload-too-large', 415: 'unsupported-media-type',
  422: 'unprocessable-entity', 429: 'too-many-requests',
};

const STATUS_BY_DOMAIN_CODE: Record<string, number> = {
  'product-not-found': 404,
  'out-of-stock': 409,
  'duplicate-sku': 409,
  'duplicate-slug': 409,
  'category-in-use': 409,
  'tag-not-found': 404,
  'category-not-found': 404, // tra cứu theo id không thấy
  // 'invalid-category' không cần liệt kê: mặc định của lỗi domain là 422 (tham chiếu tới danh mục không có: hợp lệ về cú pháp, sai nghiệp vụ).
};

const INTERNAL_DETAIL = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.adapterHost;
    const http = host.switchToHttp();
    const request = http.getRequest<unknown>();
    const response = http.getResponse<unknown>();
    const instance = String(httpAdapter.getRequestUrl(request)).split('?')[0];

    const problem = this.toProblem(exception, instance);
    if (problem.status >= 500) {
      this.logger.error(
        `${httpAdapter.getRequestMethod(request)} ${instance} → ${problem.status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    httpAdapter.setHeader(response, 'Content-Type', 'application/problem+json');
    httpAdapter.reply(response, problem, problem.status);
  }

  private toProblem(exception: unknown, instance: string): ProblemDetails {
    if (exception instanceof ValidationFailedException) {
      return this.build(400, 'validation', exception.message, instance, { errors: exception.errors });
    }
    if (exception instanceof DomainError) {
      const status = STATUS_BY_DOMAIN_CODE[exception.code] ?? 422;
      return this.build(status, exception.code, exception.message, instance, exception.extensions);
    }
    if (exception instanceof HttpException) {
      return this.fromStatus(exception.getStatus(), messageOf(exception.getResponse()), instance);
    }
    // Lỗi từ tầng HTTP (body-parser/http-errors): có status nhưng không phải HttpException.
    const status = httpErrorStatus(exception);
    if (status !== undefined) return this.fromStatus(status, (exception as { message?: string }).message ?? '', instance);
    return this.build(500, 'internal', INTERNAL_DETAIL, instance);
  }

  private fromStatus(status: number, message: string, instance: string): ProblemDetails {
    const code = status >= 500 ? 'internal' : (CODE_BY_STATUS[status] ?? 'error');
    return this.build(status, code, status >= 500 ? INTERNAL_DETAIL : message, instance);
  }

  private build(status: number, code: string, detail: string, instance: string, extra: Record<string, unknown> = {}): ProblemDetails {
    return { type: TYPE_PREFIX + code, title: STATUS_CODES[status] ?? 'Error', status, detail, instance, ...extra };
  }
}

function messageOf(response: string | object): string {
  if (typeof response === 'string') return response;
  const message = (response as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : '';
}

function httpErrorStatus(e: unknown): number | undefined {
  if (typeof e !== 'object' || e === null) return undefined;
  const status = (e as { status?: unknown; statusCode?: unknown }).status ?? (e as { statusCode?: unknown }).statusCode;
  return typeof status === 'number' && status >= 400 && status <= 599 ? status : undefined;
}
