// ex08 · batch — đáp án best practice
//
// - `for await` chạy được trên CẢ iterable đồng bộ lẫn bất đồng bộ → một hàm cho mọi nguồn.
// - Gom vào mảng `lot`; đủ size thì yield rồi tạo mảng mới (không tái sử dụng mảng đã yield —
//   caller có thể đang giữ nó, vd. insert bất đồng bộ).
// - Lười: generator dừng ở yield cho tới khi caller xử lý xong lô → bộ nhớ chỉ chứa 1 lô.
// - Validate trong generator: lỗi xuất hiện ở lần next() đầu tiên (đó là cách generator hoạt động).
// Dùng: for await (const rows of batch(readCsv(file), 1000)) await repo.insert(rows);  (B03)
export async function* batch(source, size) {
  if (!Number.isInteger(size) || size <= 0) throw new RangeError(`size must be a positive integer, got ${size}`);
  let lot = [];
  for await (const item of source) {
    lot.push(item);
    if (lot.length === size) {
      yield lot;
      lot = [];
    }
  }
  if (lot.length > 0) yield lot;
}
