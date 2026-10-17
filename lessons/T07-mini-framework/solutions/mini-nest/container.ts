// mini-nest · container — đáp án best practice
//
// - Provider được "chuẩn hóa" thành Recipe (class | value | factory) khi register → resolve chỉ xử lý 3 trường hợp.
// - Dependency của class: token @Inject (ưu tiên) hoặc design:paramtypes. Kiểu `Object` = interface/literal
//   không có token → lỗi rõ ràng (đây chính là thông báo "can't resolve dependencies of X (?)" của Nest).
// - `path` (mảng token đang resolve) truyền theo đệ quy: gặp lại token trong path = vòng → in đường đi.
//   Dùng path theo nhánh (không phải Set toàn cục) để "kim cương" (2 nhánh cùng dùng 1 dependency) không bị báo nhầm.
// - Singleton cache theo token; thứ tự tạo được ghi lại để chạy onModuleInit (dependency luôn được tạo trước).
import 'reflect-metadata';

export type Token<T = unknown> = string | symbol | (abstract new (...args: never[]) => T);
type Ctor = new (...args: never[]) => unknown;
export type Scope = 'singleton' | 'transient';
export type Provider =
  | Ctor
  | { provide: Token; useClass: Ctor }
  | { provide: Token; useValue: unknown }
  | { provide: Token; useFactory: (...args: never[]) => unknown; inject?: Token[] };

type Recipe =
  | { kind: 'class'; cls: Ctor; scope: Scope }
  | { kind: 'value'; value: unknown }
  | { kind: 'factory'; factory: (...args: unknown[]) => unknown; inject: Token[] };

const SCOPE = Symbol('di:scope');
const INJECT = Symbol('di:inject');

export function Injectable(options: { scope?: Scope } = {}): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(SCOPE, options.scope ?? 'singleton', target);
  };
}

export function Inject(token: Token): ParameterDecorator {
  return (target, propertyKey, index) => {
    if (propertyKey !== undefined) throw new TypeError('@Inject() can only be used on constructor parameters');
    const tokens = new Map<number, Token>(Reflect.getOwnMetadata(INJECT, target) ?? []);
    tokens.set(index, token);
    Reflect.defineMetadata(INJECT, tokens, target);
  };
}

export const tokenName = (token: Token): string =>
  typeof token === 'string' ? token : typeof token === 'symbol' ? (token.description ?? token.toString()) : token.name;

function dependenciesOf(cls: Ctor): Token[] {
  const paramTypes: unknown[] = Reflect.getMetadata('design:paramtypes', cls) ?? [];
  const tokens: Map<number, Token> = Reflect.getOwnMetadata(INJECT, cls) ?? new Map();
  const length = Math.max(paramTypes.length, ...[...tokens.keys()].map((i) => i + 1));
  return Array.from({ length }, (_, i) => {
    const token = tokens.get(i) ?? paramTypes[i];
    if (token === undefined || token === Object) {
      throw new Error(`Cannot resolve dependency of ${cls.name} at index ${i} — use @Inject(token)`);
    }
    return token as Token;
  });
}

export class Container {
  readonly #recipes = new Map<Token, Recipe>();
  readonly #singletons = new Map<Token, unknown>();
  readonly #created: unknown[] = [];

  register(provider: Provider): this {
    if (typeof provider === 'function') {
      this.#recipes.set(provider, { kind: 'class', cls: provider, scope: Reflect.getMetadata(SCOPE, provider) ?? 'singleton' });
    } else if ('useValue' in provider) {
      this.#recipes.set(provider.provide, { kind: 'value', value: provider.useValue });
    } else if ('useClass' in provider) {
      this.#recipes.set(provider.provide, { kind: 'class', cls: provider.useClass, scope: Reflect.getMetadata(SCOPE, provider.useClass) ?? 'singleton' });
    } else {
      this.#recipes.set(provider.provide, { kind: 'factory', factory: provider.useFactory as (...args: unknown[]) => unknown, inject: provider.inject ?? [] });
    }
    return this;
  }

  resolve<T>(token: Token<T>): T {
    return this.#resolve(token, []) as T;
  }

  /** Các singleton theo thứ tự được tạo (dependency trước) — dùng cho lifecycle hook. */
  get createdInstances(): readonly unknown[] {
    return this.#created;
  }

  #resolve(token: Token, path: Token[]): unknown {
    if (path.includes(token)) {
      throw new Error(`Circular dependency: ${[...path, token].map(tokenName).join(' -> ')}`);
    }
    const recipe = this.#recipes.get(token);
    if (!recipe) {
      const by = path.at(-1);
      throw new Error(`No provider for ${tokenName(token)}${by === undefined ? '' : ` (required by ${tokenName(by)})`}`);
    }
    if (recipe.kind === 'value') return recipe.value;

    const singleton = recipe.kind === 'factory' || recipe.scope === 'singleton';
    if (singleton && this.#singletons.has(token)) return this.#singletons.get(token);

    const next = [...path, token];
    const instance =
      recipe.kind === 'class'
        ? new (recipe.cls as new (...args: unknown[]) => unknown)(...dependenciesOf(recipe.cls).map((dep) => this.#resolve(dep, next)))
        : recipe.factory(...recipe.inject.map((dep) => this.#resolve(dep, next)));

    if (singleton) {
      this.#singletons.set(token, instance);
      this.#created.push(instance);
    }
    return instance;
  }
}
