// ex09 · topKFrequent — đáp án best practice
//
// - Một lượt duyệt đếm bằng Map → hoạt động với generator chỉ duyệt được một lần, O(n).
// - Sắp toàn bộ rồi slice(0, k): O(u log u) với u = số từ khác nhau. Khi u rất lớn và k nhỏ, dùng min-heap
//   kích thước k → O(u log k).
// - Collator 'vi' tạo một lần cho tiêu chí phụ.
const collator = new Intl.Collator('vi');

export function topKFrequent(words, k) {
  const counts = new Map();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return [...counts].toSorted(([wa, ca], [wb, cb]) => cb - ca || collator.compare(wa, wb)).slice(0, k);
}
