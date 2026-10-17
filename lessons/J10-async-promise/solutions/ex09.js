// ex09 · chunkedSum — đáp án best practice
//
// - Mỗi đoạn tính đồng bộ (nhanh), rồi `setImmediate` hẹn đoạn tiếp theo → giữa các đoạn event loop
//   rảnh để chạy timer, I/O, request khác. Một request nặng không làm các request khác đứng hình.
// - setImmediate (check phase) thay vì setTimeout(0): không bị giới hạn tối thiểu ~1ms, nhanh hơn nhiều.
// - Dùng vòng for có chỉ số trong đoạn nóng: nhanh hơn slice + reduce (không tạo mảng tạm).
// Khi việc CPU thật sự nặng (hash, nén ảnh, báo cáo lớn): dùng worker_threads (N06) hoặc đưa vào queue (P03).
import { setImmediate as yieldToEventLoop } from 'node:timers/promises';

export async function chunkedSum(numbers, chunkSize = 10_000) {
  let sum = 0;
  for (let start = 0; start < numbers.length; start += chunkSize) {
    const end = Math.min(start + chunkSize, numbers.length);
    for (let i = start; i < end; i++) sum += numbers[i];
    if (end < numbers.length) await yieldToEventLoop();
  }
  return sum;
}
