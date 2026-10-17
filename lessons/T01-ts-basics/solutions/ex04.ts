// ex04 · updateUser — đáp án best practice
//
// - UserPatch suy ra từ User bằng utility type: Partial<Omit<User, 'id'>> → đổi User là patch tự đổi theo
//   (không khai báo trùng lặp). Chi tiết utility type ở T05.
// - Lọc giá trị undefined trước khi spread: { name: undefined } không xóa mất tên.
// - `readonly id` → compiler chặn gán lại id ở mọi nơi.
export interface User {
  readonly id: number;
  name: string;
  email?: string;
}

export type UserPatch = Partial<Omit<User, 'id'>>;

export function updateUser(user: User, patch: UserPatch): User {
  const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
  return { ...user, ...defined };
}
