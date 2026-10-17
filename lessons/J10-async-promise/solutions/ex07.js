// ex07 · createDeferred — đáp án best practice
//
// - Executor của Promise chạy ĐỒNG BỘ ngay trong constructor → gán resolve/reject ra biến ngoài là an toàn,
//   khi `new Promise(...)` trả về thì hai biến đã có giá trị.
// - Dùng khi cần nối thế giới callback/event với Promise mà không bọc được trong một chỗ
//   (vd. hàng đợi request chờ kết nối DB rảnh).
// Node 22+: `Promise.withResolvers()` làm đúng việc này.
export function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
