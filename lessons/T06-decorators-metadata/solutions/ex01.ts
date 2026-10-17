// ex01 · Entity / Sealed — đáp án best practice
//
// - Decorator factory (Entity) trả về ClassDecorator; decorator không tham số (Sealed) là chính hàm decorator.
// - Metadata key là Symbol riêng của module → không đụng key của thư viện khác.
// - getOwnMetadata (không kế thừa): lớp con không tự nhận tên bảng của lớp cha.
// TypeORM @Entity('users') làm đúng việc ghi metadata này rồi dùng khi tạo câu SQL.
import 'reflect-metadata';

const TABLE = Symbol('entity:table');

export function Entity(table: string): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(TABLE, table, target);
  };
}

export function getTableName(cls: Function): string {
  const table: unknown = Reflect.getOwnMetadata(TABLE, cls);
  if (typeof table !== 'string') throw new Error(`${cls.name} is not decorated with @Entity`);
  return table;
}

export const Sealed: ClassDecorator = (target) => {
  Object.seal(target);
  Object.seal(target.prototype);
};
