import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export interface FieldError {
  field: string;
  message: string;
}

export class ValidationFailedException extends BadRequestException {
  constructor(readonly errors: FieldError[]) {
    super('Dữ liệu không hợp lệ');
  }
}

/** Làm phẳng cây ValidationError thành [{ field: 'items.1.quantity', message }]. Không đưa giá trị người dùng vào kết quả. */
export function flattenValidationErrors(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap((e) => {
    const field = parent ? `${parent}.${e.property}` : e.property;
    const own = Object.values(e.constraints ?? {}).map((message) => ({ field, message }));
    return [...own, ...flattenValidationErrors(e.children ?? [], field)];
  });
}
