// ex08 · router decorators — đáp án best practice (cách Nest RouterExplorer làm, thu nhỏ)
//
// - Method decorator chỉ ghi { method, path, handler } vào danh sách trên prototype; Controller ghi prefix lên class.
//   Không đăng ký route ngay → thứ tự import file không quan trọng, getRoutes là nơi duy nhất "lắp ráp".
// - Factory chung `route(method)` tạo Get/Post/Put/Delete — không lặp code.
// - normalizePath: tách theo '/', bỏ phần rỗng, nối lại với một '/' đầu → mọi kiểu viết ('/orders/', 'orders') ra cùng kết quả.
// - Phát hiện trùng bằng Set "METHOD path" → lỗi lúc khởi động thay vì route bị che âm thầm.
import 'reflect-metadata';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
interface RouteDef {
  method: HttpMethod;
  path: string;
  handler: string;
}
export interface RouteInfo extends RouteDef {
  controller: string;
}

const PREFIX = Symbol('router:prefix');
const ROUTES = Symbol('router:routes');

export function Controller(prefix = ''): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(PREFIX, prefix, target);
  };
}

const route =
  (method: HttpMethod) =>
  (path = '') =>
  (target: object, key: string | symbol, _descriptor: PropertyDescriptor): void => {
    const routes: RouteDef[] = Reflect.getOwnMetadata(ROUTES, target) ?? [];
    Reflect.defineMetadata(ROUTES, [...routes, { method, path, handler: String(key) }], target);
  };

export const Get = route('GET');
export const Post = route('POST');
export const Put = route('PUT');
export const Delete = route('DELETE');

const normalizePath = (...parts: string[]): string => '/' + parts.flatMap((p) => p.split('/')).filter(Boolean).join('/');

export function getRoutes(controllers: Function[]): RouteInfo[] {
  const seen = new Set<string>();
  return controllers.flatMap((cls) => {
    const prefix: unknown = Reflect.getOwnMetadata(PREFIX, cls);
    if (typeof prefix !== 'string') throw new Error(`${cls.name} is missing @Controller()`);
    const defs: RouteDef[] = Reflect.getOwnMetadata(ROUTES, cls.prototype) ?? [];
    return defs.map(({ method, path, handler }) => {
      const full = normalizePath(prefix, path);
      const id = `${method} ${full}`;
      if (seen.has(id)) throw new Error(`Duplicate route: ${id}`);
      seen.add(id);
      return { method, path: full, controller: cls.name, handler };
    });
  });
}
