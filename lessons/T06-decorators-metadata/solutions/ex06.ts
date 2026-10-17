// ex06 · validation decorators — đáp án best practice (class-validator mini)
//
// - Mỗi decorator chỉ ĐĂNG KÝ một rule vào metadata của prototype (Map<property, Rule[]>), validate() mới chạy.
// - Decorator áp dụng từ dưới lên, nên khi thêm rule ta chèn vào ĐẦU danh sách → thứ tự chạy = thứ tự đọc từ trên xuống.
// - Đi chuỗi prototype từ gốc xuống để property lớp cha được kiểm trước.
// - IsOptional là cờ riêng, không phải rule.
// class-validator thật: thêm groups, nested (@ValidateNested), message tùy biến, async validator.
import 'reflect-metadata';

type Constraint = 'isString' | 'isEmail' | 'min' | 'max';
interface Rule {
  constraint: Constraint;
  check: (value: unknown) => boolean;
  message: string;
}
interface PropertyRules {
  optional: boolean;
  rules: Rule[];
}
export interface ValidationError {
  property: string;
  constraint: Constraint;
  message: string;
}

const RULES = Symbol('validation:rules');

const ownRules = (target: object): Map<string, PropertyRules> => {
  let map: Map<string, PropertyRules> | undefined = Reflect.getOwnMetadata(RULES, target);
  if (!map) {
    map = new Map();
    Reflect.defineMetadata(RULES, map, target);
  }
  return map;
};

const entryFor = (target: object, property: string | symbol): PropertyRules => {
  const map = ownRules(target);
  const key = String(property);
  let entry = map.get(key);
  if (!entry) {
    entry = { optional: false, rules: [] };
    map.set(key, entry);
  }
  return entry;
};

const rule =
  (constraint: Constraint, check: Rule['check'], message: string): PropertyDecorator =>
  (target, property) => {
    entryFor(target, property).rules.unshift({ constraint, check, message: `${String(property)} ${message}` });
  };

export const IsString = () => rule('isString', (v) => typeof v === 'string', 'must be a string');
export const IsEmail = () => rule('isEmail', (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'must be an email');
export const Min = (n: number) => rule('min', (v) => typeof v === 'number' && v >= n, `must be >= ${n}`);
export const Max = (n: number) => rule('max', (v) => typeof v === 'number' && v <= n, `must be <= ${n}`);
export const IsOptional = (): PropertyDecorator => (target, property) => {
  entryFor(target, property).optional = true;
};

export function validate(obj: object): ValidationError[] {
  const chain: object[] = [];
  for (let p: object | null = Object.getPrototypeOf(obj); p && p !== Object.prototype; p = Object.getPrototypeOf(p)) chain.unshift(p);

  const errors: ValidationError[] = [];
  for (const proto of chain) {
    const map: Map<string, PropertyRules> | undefined = Reflect.getOwnMetadata(RULES, proto);
    for (const [property, { optional, rules }] of map ?? []) {
      const value: unknown = (obj as Record<string, unknown>)[property];
      if (optional && value == null) continue;
      for (const r of rules) if (!r.check(value)) errors.push({ property, constraint: r.constraint, message: r.message });
    }
  }
  return errors;
}
