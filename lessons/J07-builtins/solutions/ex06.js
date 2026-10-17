// ex06 · maskEmail — đáp án best practice
//
// - Regex validate đủ chặt cho mục đích này: không khoảng trắng, đúng một '@', domain có ít nhất
//   một dấu chấm và không bắt đầu bằng dấu chấm. (Validate email "chuẩn RFC" hoàn toàn thì dùng
//   thư viện / class-validator @IsEmail.)
// - Nhóm bắt tách local và domain luôn.
// - '*'.repeat(n) đúng số ký tự bị che.
const EMAIL = /^([^\s@]+)@([^\s@.][^\s@]*\.[^\s@]+)$/;

export function maskEmail(email) {
  const match = EMAIL.exec(email);
  if (!match) throw new TypeError(`Invalid email: ${email}`);
  const [, local, domain] = match;
  const masked = local.length >= 4 ? `${local.slice(0, 2)}${'*'.repeat(local.length - 3)}${local.at(-1)}` : `${local[0]}***`;
  return `${masked}@${domain}`;
}
