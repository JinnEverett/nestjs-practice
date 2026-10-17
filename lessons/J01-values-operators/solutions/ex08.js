// ex08 · compareVersions — đáp án best practice
//
// - Tách theo '.', đổi từng phần sang số bằng map(Number) rồi so lần lượt.
// - So chuỗi: '10' < '9' là true (so từng ký tự) → bug kinh điển khi sort version.
// - Math.sign chuẩn hóa hiệu số về -1 / 0 / 1.
// - Dùng độ dài lớn nhất + `?? 0` để mở rộng được cho '1.2' vs '1.2.0' (phần thiếu coi là 0).
// Trong dự án thật: dùng thư viện `semver` (xử lý cả pre-release như 1.0.0-beta.1).
export function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}
