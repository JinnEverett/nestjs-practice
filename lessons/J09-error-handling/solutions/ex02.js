// ex02 · Cây custom error — đáp án best practice
//
// - `super(message, { cause })` dùng cơ chế cause chuẩn ES2022 (log/inspect của Node in cả chuỗi cause).
// - `this.name = new.target.name` → mọi lớp con (kể cả lớp chưa viết) tự có name đúng.
// - Các lớp con chỉ cố định code/statusCode, vẫn nhận `options` (để truyền cause).
// - `toJSON` chọn field an toàn để serialize (Error mặc định stringify ra '{}').
// - Spread `...(details !== undefined && { details })` → chỉ thêm key khi có.
// Trong NestJS: HttpException và các lớp con (NotFoundException...) làm đúng vai trò này (C06).
export class AppError extends Error {
  constructor(message, { code = 'INTERNAL_ERROR', statusCode = 500, details, cause } = {}) {
    super(message, { cause });
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON() {
    return { name: this.name, code: this.code, message: this.message, ...(this.details !== undefined && { details: this.details }) };
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found', options = {}) {
    super(message, { ...options, code: 'NOT_FOUND', statusCode: 404 });
  }
}

export class ValidationError extends AppError {
  constructor(details = [], message = 'Validation failed', options = {}) {
    super(message, { ...options, code: 'VALIDATION_ERROR', statusCode: 400, details });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', options = {}) {
    super(message, { ...options, code: 'CONFLICT', statusCode: 409 });
  }
}
