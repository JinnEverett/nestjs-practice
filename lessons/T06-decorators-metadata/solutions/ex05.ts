// ex05 · Roles / Public — đáp án best practice (giống Reflector.getAllAndOverride của Nest)
//
// - Một factory trả về hàm nhận (target, propertyKey?) → dùng được cả class decorator lẫn method decorator:
//   class → ghi lên constructor; method → ghi lên prototype + tên method.
// - Đọc: method trước (cụ thể hơn), rồi class; Reflect.getMetadata tự lần chuỗi prototype → kế thừa miễn phí.
// - Helper `forBoth` tránh lặp logic giữa Roles và Public.
import 'reflect-metadata';

const ROLES = Symbol('auth:roles');
const PUBLIC = Symbol('auth:public');

type ClassOrMethodDecorator = (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => void;

const forBoth =
  (key: symbol, value: unknown): ClassOrMethodDecorator =>
  (target, propertyKey) => {
    if (propertyKey === undefined) Reflect.defineMetadata(key, value, target);
    else Reflect.defineMetadata(key, value, target, propertyKey);
  };

export const Roles = (...roles: string[]): ClassOrMethodDecorator => forBoth(ROLES, roles);
export const Public = (): ClassOrMethodDecorator => forBoth(PUBLIC, true);

const lookup = <T>(key: symbol, cls: Function, method: string): T | undefined =>
  Reflect.getMetadata(key, cls.prototype, method) ?? Reflect.getMetadata(key, cls);

export function getRoles(cls: Function, method: string): string[] {
  return lookup<string[]>(ROLES, cls, method) ?? [];
}

export function isPublic(cls: Function, method: string): boolean {
  return lookup<boolean>(PUBLIC, cls, method) ?? false;
}
