import { applyDecorators, Header } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export interface DeprecationInfo {
  since: Date;
  sunset: Date;
  successor?: string;
  summary: string;
}

/**
 * Đánh dấu route sắp bị gỡ: cờ `deprecated` trong OpenAPI + header `Deprecation` (RFC 9745),
 * `Sunset` (RFC 8594) và `Link: <...>; rel="successor-version"`. Header tĩnh nên vẫn có khi phản hồi lấy từ cache.
 */
export const ApiDeprecated = ({ since, sunset, successor, summary }: DeprecationInfo) =>
  applyDecorators(
    ApiOperation({ summary: `${summary} (DEPRECATED)`, deprecated: true }),
    Header('Deprecation', `@${Math.floor(since.getTime() / 1000)}`),
    Header('Sunset', sunset.toUTCString()),
    ...(successor ? [Header('Link', `<${successor}>; rel="successor-version"`)] : []),
  );
