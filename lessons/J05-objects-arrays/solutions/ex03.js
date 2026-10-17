// ex03 · toUserResponse — đáp án best practice
//
// - Liệt kê TƯỜNG MINH các field được phép ra ngoài (allow-list). Không dùng `{ ...user }` rồi
//   delete passwordHash (deny-list): mai ai thêm field `resetToken` vào entity là lộ luôn.
// - Destructuring tham số có đổi tầng + default: `profile: { fullName, avatarUrl = null }`.
// - `?? null` cho field tùy chọn → JSON luôn có key, client không phải phân biệt thiếu/undefined.
// - `[...roles]` → mảng mới, response không dùng chung tham chiếu với entity.
// Trong NestJS: class UserResponseDto + ClassSerializerInterceptor / @Exclude (A01).
export function toUserResponse({ id, email, profile: { fullName, avatarUrl = null }, address, roles = [], createdAt }) {
  return {
    id,
    email,
    fullName,
    avatarUrl,
    city: address?.city ?? null,
    roles: [...roles],
    createdAt: createdAt.toISOString(),
  };
}
