// ex05 · DTO dẫn xuất từ entity — đáp án best practice
//
// - Mọi DTO DẪN XUẤT từ UserEntity → thêm/đổi field ở entity, DTO tự theo; không bao giờ lệch.
// - Omit + & để thêm field mới (password) — phần giao (intersection) phải "phẳng" để Equal khớp, nên bọc bằng
//   mapped type Simplify (kỹ thuật phổ biến giúp tooltip của IDE dễ đọc).
// - UserResponse: Omit rồi ghi đè kiểu ngày thành string (sau JSON, Date là chuỗi) — trung thực với dữ liệu client nhận.
// Trong NestJS: OmitType/PartialType của @nestjs/mapped-types làm điều này cho CLASS (giữ decorator validate) — C05.
type Simplify<T> = { [K in keyof T]: T[K] };

export interface UserEntity {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserDto = Simplify<Omit<UserEntity, 'id' | 'passwordHash' | 'createdAt' | 'updatedAt' | 'role'> & { password: string }>;
export type UpdateUserDto = Partial<Omit<CreateUserDto, 'email'>>;
export type UserResponse = Simplify<Omit<UserEntity, 'passwordHash' | 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string }>;

export function toUserResponse({ passwordHash: _hidden, createdAt, updatedAt, ...rest }: UserEntity): UserResponse {
  return { ...rest, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() };
}
