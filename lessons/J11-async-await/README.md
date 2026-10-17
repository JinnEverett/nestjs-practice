# J11 · Async II: async/await & concurrency

Đọc khoảng 12 phút.

## Mục tiêu: sau buổi này bạn làm được
- Viết `async/await` đúng: bắt lỗi, không quên `await`, biết `async` function chạy đồng bộ tới `await` đầu tiên.
- Chọn đúng tuần tự vs song song; dùng `Promise.all / allSettled / race / any`.
- **Giới hạn concurrency** (không bắn 10 000 request cùng lúc vào DB).
- Retry có backoff, timeout có hủy thật bằng `AbortController`.
- Gộp nhiều lời gọi lẻ thành một batch (ý tưởng DataLoader — chữa N+1).

---

## 1. async/await là cú pháp cho Promise
```js
async function getTotal(id) {          // luôn trả Promise
  const order = await repo.find(id);   // tạm dừng HÀM NÀY, event loop vẫn chạy việc khác
  if (!order) throw new NotFoundError(); // = reject
  return order.total;                  // = resolve
}
```
- Thân hàm chạy **đồng bộ** cho tới `await` đầu tiên.
- `try/catch` bắt được lỗi của promise được `await`.
- `return promise` trong `try` (không `await`) → lỗi **không** bị catch của hàm đó bắt. Muốn bắt: `return await promise`.

## 2. Tuần tự vs song song
```js
// ❌ tuần tự vô ích: 3 × 100ms = 300ms
const user = await getUser(id);
const orders = await getOrders(id);
const coupons = await getCoupons(id);
// ✅ độc lập nhau → song song: ~100ms
const [user, orders, coupons] = await Promise.all([getUser(id), getOrders(id), getCoupons(id)]);
```
| Combinator | Resolve khi | Reject khi |
|---|---|---|
| `Promise.all` | **tất cả** thành công (mảng kết quả theo thứ tự) | **một** cái lỗi (ngay lập tức) |
| `Promise.allSettled` | tất cả settle (không bao giờ reject) | — |
| `Promise.race` | cái **đầu tiên settle** thành công | cái đầu tiên settle là lỗi |
| `Promise.any` | cái **đầu tiên thành công** | tất cả lỗi → `AggregateError` |

⚠️ `Promise.all` reject sớm nhưng **không hủy** các promise còn lại — chúng vẫn chạy.

## 3. Vòng lặp với await
```js
for (const o of orders) await charge(o);              // tuần tự (đúng khi thứ tự quan trọng)
await Promise.all(orders.map((o) => charge(o)));      // song song tất cả
orders.forEach(async (o) => await charge(o));         // ❌ forEach KHÔNG đợi — hàm trả về ngay
```

## 4. Giới hạn concurrency
Song song 10 000 việc cùng lúc = 10 000 kết nối/query → pool DB cạn, dịch vụ ngoài chặn bạn (429), RAM tăng. Chạy tối đa N việc cùng lúc: tự viết `pLimit` (ex03) hoặc dùng thư viện `p-limit`.

## 5. Retry & backoff
Chỉ retry lỗi **tạm thời** (timeout, 503, mất kết nối), không retry lỗi 4xx. Đợi tăng dần: 100ms, 200ms, 400ms… (exponential backoff), thêm **jitter** ngẫu nhiên để nhiều client không retry cùng một khoảnh khắc. Thao tác ghi chỉ retry khi **idempotent** (R02).

## 6. Hủy bằng AbortController
```js
const controller = new AbortController();
setTimeout(() => controller.abort(), 2000);
const res = await fetch(url, { signal: controller.signal });   // bị hủy THẬT, không chỉ "thôi đợi"
// gọn: fetch(url, { signal: AbortSignal.timeout(2000) })
```
Hàm của bạn nhận `signal` thì kiểm tra `signal.aborted` / nghe `signal.addEventListener('abort', ...)` và truyền tiếp xuống.

## 7. Batching (DataLoader)
Trong một tick có 50 lời gọi `loadUser(id)` lẻ → gom thành một `SELECT ... WHERE id IN (...)`. Đây là cách GraphQL (M05) và các API lồng dữ liệu tránh N+1 query.

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| Quên `await` | lỗi thành unhandled rejection, logic chạy trước khi dữ liệu có |
| `forEach(async ...)` | không đợi, lỗi bị nuốt |
| `await` trong vòng lặp với việc độc lập | chậm N lần |
| `Promise.all` với 10 000 phần tử gọi DB | cạn pool, timeout dây chuyền |
| `return promise` trong `try` | `catch` của hàm không bắt được |
| Retry mọi lỗi, không giới hạn | khuếch đại sự cố (retry storm) |

## Bên trong NestJS dùng cái này ở đâu
- Mọi service method là `async`. Bug "quên await" trong Nest = response trả trước khi DB ghi xong.
- `HttpModule`/axios timeout + retry (P09), BullMQ job concurrency (P03), graceful shutdown chờ request đang chạy (P02 — ex09).

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/J11-async-await NN`.
