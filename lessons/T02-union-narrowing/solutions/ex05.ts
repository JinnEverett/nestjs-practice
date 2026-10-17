// ex05 · isUser / parseUsers — đáp án best practice
//
// - Thu hẹp dần: object → có key → đúng kiểu từng key. Với TS 4.9+, `'id' in x` làm x có thuộc tính id: unknown,
//   nên không cần ép kiểu.
// - Kiểm cả field tùy chọn: nếu có thì phải đúng kiểu.
// - parseUsers: JSON.parse trả any → gán vào biến `unknown` ngay để bị buộc kiểm tra.
// - filter(isUser) → TS hiểu kết quả là User[] nhờ type predicate.
// Dự án thật: dùng zod (`z.array(UserSchema).safeParse`) hoặc class-validator — viết guard tay dễ sót.
export interface User {
  id: number;
  email: string;
  name?: string;
}

export function isUser(x: unknown): x is User {
  if (typeof x !== 'object' || x === null) return false;
  if (!('id' in x) || typeof x.id !== 'number' || !Number.isInteger(x.id) || x.id <= 0) return false;
  if (!('email' in x) || typeof x.email !== 'string' || !x.email.includes('@')) return false;
  if ('name' in x && x.name !== undefined && typeof x.name !== 'string') return false;
  return true;
}

export function parseUsers(json: string): User[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return [];
  }
  return Array.isArray(data) ? data.filter(isUser) : [];
}
