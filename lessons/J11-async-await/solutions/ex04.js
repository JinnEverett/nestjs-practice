// ex04 · mapWithConcurrency — đáp án best practice
//
// - Mô hình "worker pool": tạo `concurrency` worker; mỗi worker lặp lấy index kế tiếp (biến dùng chung
//   `nextIndex` — an toàn vì JS đơn luồng, không có race giữa 2 dòng code đồng bộ).
// - Ghi kết quả theo index → giữ thứ tự đầu vào.
// - Cờ `failed`: khi một mapper lỗi, các worker dừng lấy việc mới; Promise.all của worker reject với lỗi đầu tiên.
// - Math.min(concurrency, items.length) → không tạo worker thừa.
export async function mapWithConcurrency(items, mapper, concurrency) {
  const results = new Array(items.length);
  let nextIndex = 0;
  let failed = false;

  const worker = async () => {
    while (!failed && nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = await mapper(items[index], index);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}
