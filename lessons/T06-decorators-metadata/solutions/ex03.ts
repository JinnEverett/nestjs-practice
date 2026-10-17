// ex03 · Column / getColumns — đáp án best practice
//
// - design:type (do emitDecoratorMetadata sinh) cho biết kiểu lúc chạy của property: String/Number/Boolean/Date.
//   Union (string | null), mảng, interface → Object/Array → không suy được → bắt buộc khai type tường minh.
//   TypeORM cũng vậy: cột nullable phải ghi @Column({ type: 'varchar', nullable: true }).
// - Lưu danh sách cột trên CHÍNH prototype (getOwnMetadata) rồi khi đọc thì đi chuỗi prototype từ gốc xuống
//   → cột lớp cha đứng trước, lớp cha không bị "nhiễm" cột của lớp con.
// - Lỗi ném ngay lúc decorate (lúc định nghĩa class) → phát hiện khi khởi động, không đợi tới lúc chạy query.
import 'reflect-metadata';

export type ColumnType = 'string' | 'number' | 'boolean' | 'date';
export interface ColumnMeta {
  property: string;
  type: ColumnType;
  nullable: boolean;
}

const COLUMNS = Symbol('entity:columns');
const TYPE_MAP = new Map<unknown, ColumnType>([
  [String, 'string'],
  [Number, 'number'],
  [Boolean, 'boolean'],
  [Date, 'date'],
]);

export function Column(options: { type?: ColumnType; nullable?: boolean } = {}): PropertyDecorator {
  return (target, property) => {
    const type = options.type ?? TYPE_MAP.get(Reflect.getMetadata('design:type', target, property));
    if (!type) throw new TypeError(`Cannot infer column type for ${target.constructor.name}.${String(property)}`);
    const own: ColumnMeta[] = Reflect.getOwnMetadata(COLUMNS, target) ?? [];
    Reflect.defineMetadata(COLUMNS, [...own, { property: String(property), type, nullable: options.nullable ?? false }], target);
  };
}

export function getColumns(cls: Function): ColumnMeta[] {
  const chain: object[] = [];
  for (let proto: object | null = cls.prototype; proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) chain.unshift(proto);
  return chain.flatMap((proto): ColumnMeta[] => Reflect.getOwnMetadata(COLUMNS, proto) ?? []);
}
