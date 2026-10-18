import { Mutant } from './_mutation';

export const PARSE_ID_MUTANTS: Mutant[] = [
  { name: 'chấp nhận 0 và số 0 đứng đầu (regex \\d+)', edits: [['/^[1-9]\\d*$/', '/^\\d+$/']] },
  { name: 'số vượt 2^53 lọt qua (isInteger thay isSafeInteger)', edits: [['!Number.isSafeInteger(n) || n < 1', '!Number.isInteger(n) || n < 1']] },
  { name: 'number 0 / âm lọt qua', edits: [['!Number.isSafeInteger(n) || n < 1', '!Number.isSafeInteger(n)']] },
  { name: 'thông báo lỗi không nêu tên tham số', edits: [["metadata.data ?? 'id'", "'id'"]] },
  { name: 'từ chối number (không chịu được ValidationPipe transform)', edits: [["typeof value === 'number' ? value :", "typeof value === 'number' ? NaN :"]] },
];

export const PARSE_SKU_MUTANTS: Mutant[] = [
  { name: 'không đổi chữ hoa', edits: [['value.trim().toUpperCase()', 'value.trim()']] },
  { name: 'không trim', edits: [['value.trim().toUpperCase()', 'value.toUpperCase()']] },
  { name: 'cho phép 21 ký tự', edits: [['/^[A-Z0-9-]{3,20}$/', '/^[A-Z0-9-]{3,21}$/']] },
  { name: 'cho phép 2 ký tự', edits: [['/^[A-Z0-9-]{3,20}$/', '/^[A-Z0-9-]{2,20}$/']] },
  { name: 'cho phép dấu gạch dưới', edits: [['/^[A-Z0-9-]{3,20}$/', '/^[A-Z0-9_-]{3,20}$/']] },
  { name: 'ép mọi thứ thành chuỗi (undefined → "UNDEFINED")', edits: [["typeof value === 'string' ? value.trim().toUpperCase() : ''", 'String(value).trim().toUpperCase()']] },
];

export const GUARD_MUTANTS: Mutant[] = [
  { name: 'so sánh bằng !== thay vì timingSafeEqual', edits: [['!timingSafeEqual(sha256(provided), sha256(this.auth.adminApiKey))', 'provided !== this.auth.adminApiKey']] },
  { name: 'không kiểm kiểu header (mảng làm guard ném TypeError)', edits: [["typeof provided !== 'string' ||", '']] },
  { name: 'khóa cứng trong code, bỏ qua config', edits: [['sha256(this.auth.adminApiKey)', "sha256('secret-key-123')"]] },
  { name: 'chấp nhận mọi khóa không rỗng', edits: [['!timingSafeEqual(sha256(provided), sha256(this.auth.adminApiKey))', "provided === ''"]] },
  { name: 'so khớp không phân biệt hoa thường', edits: [['sha256(provided), sha256(this.auth.adminApiKey)', 'sha256(provided.toLowerCase()), sha256(this.auth.adminApiKey.toLowerCase())']] },
  { name: 'chấp nhận khi thiếu header', edits: [["typeof provided !== 'string' ||", "typeof provided !== 'string' && provided !== undefined ||"]] },
];

export const TIMEOUT_MUTANTS: Mutant[] = [
  { name: 'mặc định 50000 thay vì 5000', edits: [['DEFAULT_TIMEOUT_MS = 5_000', 'DEFAULT_TIMEOUT_MS = 50_000']] },
  { name: 'bỏ qua @Timeout ở controller', edits: [['getAllAndOverride(Timeout, [context.getHandler(), context.getClass()])', 'get(Timeout, context.getHandler())']] },
  { name: 'controller thắng handler', edits: [['[context.getHandler(), context.getClass()]', '[context.getClass(), context.getHandler()]']] },
  { name: 'mọi lỗi đều thành 408', edits: [['err instanceof TimeoutError ?', 'true ?']] },
  { name: 'không áp timeout', edits: [['      timeout(ms),\n', '']] },
  { name: 'thông báo không nêu thời hạn', edits: [['`Xử lý quá ${ms}ms`', "'Xử lý quá lâu'"]] },
];

export const CACHE_MUTANTS: Mutant[] = [
  { name: 'ghi thành công không xóa cache', edits: [['tap(() => this.entries.clear())', 'tap(() => undefined)']] },
  { name: 'biên TTL: hết hạn đúng thời điểm vẫn HIT (>= thay >)', edits: [['hit.expiresAt > now', 'hit.expiresAt >= now']] },
  { name: 'TTL tính sai đơn vị', edits: [['ttl * 1000', 'ttl * 100']] },
  { name: 'khóa bỏ query string', edits: [['const key = req.originalUrl;', "const key = req.originalUrl.split('?')[0];"]] },
  { name: 'lưu tham chiếu, không clone khi ghi cache', edits: [['body: structuredClone(body)', 'body']] },
  { name: 'trả tham chiếu cache, không clone khi HIT', edits: [['of(structuredClone(hit.body))', 'of(hit.body)']] },
  { name: 'không có trần số mục', edits: [['if (this.entries.size > MAX_CACHE_ENTRIES)', 'if (false)']] },
  { name: 'khi vượt trần loại mục MỚI thay vì cũ nhất', edits: [['this.entries.delete(this.entries.keys().next().value as string)', 'this.entries.delete(key)']] },
  { name: 'ghi xóa cache cả khi ghi thất bại', edits: [["if (req.method !== 'GET') {\n      return next.handle().pipe(tap(() => this.entries.clear()));", "if (req.method !== 'GET') {\n      this.entries.clear();\n      return next.handle();"]] },
];

export const FILTER_MUTANTS: Mutant[] = [
  { name: 'lộ chi tiết lỗi 5xx', edits: [['status >= 500 ? INTERNAL_DETAIL : message', 'message']] },
  { name: 'instance chứa query string', edits: [[".split('?')[0]", '']] },
  { name: 'out-of-stock trả 422', edits: [["'out-of-stock': 409", "'out-of-stock': 422"]] },
  { name: 'thiếu mã 408 request-timeout', edits: [["408: 'request-timeout', ", '']] },
  { name: 'sai Content-Type', edits: [["'application/problem+json'", "'application/json'"]] },
  { name: 'mất mảng errors của validation', edits: [['{ errors: exception.errors }', '{}']] },
  { name: 'không log lỗi 5xx', edits: [['if (problem.status >= 500) {', 'if (false) {']] },
  { name: 'message mảng nối sai', edits: [["message.join('; ')", "message.join(', ')"]] },
  { name: 'bỏ qua lỗi http-errors (body-parser) → 500', edits: [['if (status !== undefined) return', 'if (false) return']] },
  { name: 'mất extension của lỗi domain', edits: [['instance, exception.extensions)', 'instance)']] },
  { name: 'nhận status ngoài 400..599', edits: [['status >= 400 && status <= 599', 'status >= 200 && status <= 599']] },
  { name: 'mã chuỗi cho status lạ khác "error"', edits: [["(CODE_BY_STATUS[status] ?? 'error')", "(CODE_BY_STATUS[status] ?? 'unknown')"]] },
];

export const REQUEST_ID_MUTANTS: Mutant[] = [
  { name: 'nhận id quá ngắn', edits: [['{8,64}', '{1,64}']] },
  { name: 'nhận id quá dài', edits: [['{8,64}', '{8,200}']] },
  { name: 'nhận id có khoảng trắng', edits: [['[A-Za-z0-9._-]', '[A-Za-z0-9._ -]']] },
  { name: 'không ghi id vào req.headers', edits: [['    req.headers[REQUEST_ID_HEADER] = id;', '']] },
  { name: 'không đặt header phản hồi', edits: [["    res.setHeader('X-Request-Id', id);", '']] },
  { name: 'quên gọi next()', edits: [['    next();', '']] },
  { name: 'id cố định cho mọi request', edits: [['randomUUID()', "'fixed-id-0000000'"]] },
];

export const HTTP_LOGGER_MUTANTS: Mutant[] = [
  { name: 'log cả query string', edits: [["req.originalUrl.split('?')[0]", 'req.originalUrl']] },
  { name: '500 không phải error', edits: [['res.statusCode >= 500', 'res.statusCode > 500']] },
  { name: '400 không phải warn', edits: [['res.statusCode >= 400', 'res.statusCode > 400']] },
  { name: 'thiếu id thì ghi chuỗi rỗng', edits: [["?? '-'", "?? ''"]] },
  { name: 'quên gọi next()', edits: [['  next();', '']] },
  { name: 'đơn vị thời gian sai', edits: [['${ms.toFixed(1)}ms', '${ms.toFixed(1)}s']] },
  { name: '5xx log ở mức warn', edits: [['logger.error(line)', 'logger.warn(line)']] },
];
