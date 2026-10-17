// mini-nest · router decorators — đáp án best practice
//
// - Decorator chỉ GHI metadata; app.ts đọc và lắp ráp lúc khởi động (tách "khai báo" khỏi "thực thi").
// - Param decorator lưu { index, source, name } theo từng method → lúc gọi handler dựng mảng tham số đúng vị trí.
// - HttpError mang status → tầng app map sang response (giống HttpException của Nest).
import 'reflect-metadata';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export interface RouteDef {
  method: HttpMethod;
  path: string;
  handler: string;
}
export interface ParamDef {
  index: number;
  source: 'param' | 'query' | 'body';
  name?: string;
}

const PREFIX = Symbol('router:prefix');
const ROUTES = Symbol('router:routes');
const PARAMS = Symbol('router:params');

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

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

const paramDecorator =
  (source: ParamDef['source'], name?: string): ParameterDecorator =>
  (target, key, index) => {
    if (key === undefined) throw new TypeError('@Param/@Query/@Body can only be used on handler methods');
    const params: ParamDef[] = Reflect.getOwnMetadata(PARAMS, target, key) ?? [];
    Reflect.defineMetadata(PARAMS, [...params, { index, source, ...(name !== undefined && { name }) }], target, key);
  };

export const Param = (name: string) => paramDecorator('param', name);
export const Query = (name: string) => paramDecorator('query', name);
export const Body = () => paramDecorator('body');

export const getPrefix = (cls: Function): string | undefined => Reflect.getOwnMetadata(PREFIX, cls);
export const getRouteDefs = (cls: Function): RouteDef[] => Reflect.getOwnMetadata(ROUTES, cls.prototype) ?? [];
export const getParamDefs = (cls: Function, handler: string): ParamDef[] => Reflect.getOwnMetadata(PARAMS, cls.prototype, handler) ?? [];
