// ex02 · fetchSequential / fetchParallel — đáp án best practice
//
// - Tuần tự: for...of + await — rõ ràng nhất. Dùng khi bước sau phụ thuộc bước trước, hoặc phải giới hạn tải.
// - Song song: map tạo hết promise (bắt đầu chạy ngay) rồi Promise.all — kết quả giữ thứ tự của mảng
//   đầu vào dù cái nào xong trước.
// - Không dùng reduce + then cho tuần tự (khó đọc), không dùng forEach + await (không đợi).
export async function fetchSequential(ids, fetchOne) {
  const results = [];
  for (const id of ids) results.push(await fetchOne(id));
  return results;
}

export function fetchParallel(ids, fetchOne) {
  return Promise.all(ids.map((id) => fetchOne(id)));
}
