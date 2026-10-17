import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Column, getColumns } from '../answers/ex03.js';

class BaseEntity {
  @Column() id!: number;
  @Column({ type: 'date' }) createdAt!: Date;
}
class User extends BaseEntity {
  @Column() email!: string;
  @Column({ type: 'string', nullable: true }) phone!: string | null;
  @Column() isActive!: boolean;
  @Column() lastLoginAt!: Date;
  notAColumn = 'x';
}

test('ex03 · cột cha trước, suy kiểu từ design:type', () => {
  assert.deepEqual(getColumns(User), [
    { property: 'id', type: 'number', nullable: false },
    { property: 'createdAt', type: 'date', nullable: false },
    { property: 'email', type: 'string', nullable: false },
    { property: 'phone', type: 'string', nullable: true },
    { property: 'isActive', type: 'boolean', nullable: false },
    { property: 'lastLoginAt', type: 'date', nullable: false },
  ]);
});
test('ex03 · lớp cha không thấy cột của lớp con', () => assert.equal(getColumns(BaseEntity).length, 2));
test('ex03 · không suy được kiểu → TypeError lúc định nghĩa class', () => {
  assert.throws(() => {
    class Bad {
      @Column() tags!: string[];
    }
    void Bad;
  }, TypeError);
});
