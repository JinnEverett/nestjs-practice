// ex04 · Injectable / Inject / getDependencies — đáp án best practice
//
// - Injectable chỉ cần TỒN TẠI: có decorator trên class thì TS mới phát design:paramtypes cho constructor.
//   (Đó là lý do service Nest bắt buộc có @Injectable() dù decorator gần như không làm gì.)
// - Parameter decorator trên constructor nhận propertyKey = undefined; trên method thì có tên → ném lỗi.
// - Ưu tiên token tường minh (@Inject) rồi mới tới kiểu; kiểu `Object` = TS không biết kiểu lúc chạy
//   (interface, type literal) → báo lỗi rõ ràng giống thông điệp "Nest can't resolve dependencies of X (?, Y)".
import 'reflect-metadata';

export type Token = string | symbol | Function;
const INJECT_TOKENS = Symbol('di:inject');
const INJECTABLE = Symbol('di:injectable');

export function Injectable(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(INJECTABLE, true, target);
  };
}

export function Inject(token: Token): ParameterDecorator {
  return (target, propertyKey, index) => {
    if (propertyKey !== undefined) throw new TypeError('@Inject() can only be used on constructor parameters');
    const tokens = new Map<number, Token>(Reflect.getOwnMetadata(INJECT_TOKENS, target) ?? []);
    tokens.set(index, token);
    Reflect.defineMetadata(INJECT_TOKENS, tokens, target);
  };
}

export function getDependencies(cls: Function): Token[] {
  const paramTypes: unknown[] = Reflect.getMetadata('design:paramtypes', cls) ?? [];
  const tokens: Map<number, Token> = Reflect.getOwnMetadata(INJECT_TOKENS, cls) ?? new Map();
  const length = Math.max(paramTypes.length, ...[...tokens.keys()].map((i) => i + 1));

  return Array.from({ length }, (_, i) => {
    const token = tokens.get(i) ?? paramTypes[i];
    if (token === undefined || token === Object) {
      throw new Error(`Cannot resolve dependency of ${cls.name} at index ${i} — add @Inject(token)`);
    }
    return token as Token;
  });
}
