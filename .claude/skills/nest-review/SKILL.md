---
name: nest-review
description: |
  Chấm và code review code JavaScript / TypeScript / NestJS người học viết theo 8 trục: đúng đắn, edge case, đọc hiểu & idiom, type safety, kiến trúc Nest, hiệu năng & tải, bảo mật, khả năng test. Chạy thật (check.sh, curl, bench), ghi lỗi lặp lại vào weaknesses.
  Triggers: /nest-review, "chấm bài", "review code này", "code này ổn không", "sao API tôi chậm", "endpoint này chịu được 100 request không"
---

# Nest Review: chấm bài và code review

Input có thể là một file, một thư mục `answers/`, một module trong `shop-api/`, `git diff`, hoặc code dán trong chat (kèm đề bài nếu có).
Mục tiêu: người học **hiểu vì sao**, không chỉ nhận một bản sửa.

## Quy trình

### 1. Xác định ngữ cảnh
- Code này giải quyết đề nào? Nếu thuộc một lesson/case thì đọc đề và test ẩn tương ứng.
- Nếu là code tự do: hỏi ngắn gọn code cần làm gì và chạy thế nào.
- Xác định tier hiện tại của người học (tracker) để không đòi hỏi kiến thức chưa học — chỉ nhắc nhẹ "sẽ học ở <ID>".

### 2. Chạy và đo
- Bài có test: `bash lessons/check.sh <dir> <NN>`.
- File TS: `npx tsc --noEmit` (lỗi kiểu là ❌ Type safety).
- Lint: `npx eslint <file>` nếu dự án đã có cấu hình.
- Endpoint: chạy `shop-api`, gọi bằng `curl -i` cả đường thành công lẫn đường lỗi.
- Nghi ngờ về tải (từ Tier B trở đi) hoặc người học hỏi về hiệu năng: chạy `bench/bench.sh` ở `1,10,100` conns, data `s,m`; bật log SQL để đếm số query mỗi request.

### 3. Chấm theo 8 trục
| Trục | Câu hỏi kiểm tra |
|---|---|
| **Correctness** | Kết quả đúng chưa? Status code đúng chưa? Có quên `await`/`return` không? Side effect trong DB đúng chưa? |
| **Edge cases** | Input rỗng, `null/undefined`, số âm/0, chuỗi toàn khoảng trắng, trùng lặp? Không tìm thấy (404)? Trùng khóa (409)? Timezone, làm tròn tiền? Hai request cùng lúc? |
| **Readability & idiom** | Tên biến/hàm rõ nghĩa chưa? Có mutate input không? Có lồng callback/`then` không cần thiết không? Hàm có làm quá nhiều việc không? Dùng đúng idiom (destructuring, `?.`, `??`, array method thay vòng lặp tay khi hợp lý)? |
| **Type safety** | Có `any`/`as` ép kiểu che lỗi không? Kiểu trả về rõ chưa? Có xử lý `undefined` từ `noUncheckedIndexedAccess` không? DTO và entity có lẫn lộn không? |
| **Nest architecture** | Logic nghiệp vụ nằm ở service hay rò ra controller? DI đúng chưa (không `new` service bằng tay)? Scope provider hợp lý? Validation qua pipe/DTO hay tự check tay? Lỗi ném `HttpException` đúng loại hay để rơi 500? Module export/import gọn chưa? |
| **Performance & load** | Có chặn event loop không (vòng lặp đồng bộ nặng, `*Sync`, `JSON` lớn)? N+1 query? Thiếu index? `await` tuần tự những việc có thể song song? Thiếu timeout khi gọi ra ngoài? Cache có giới hạn không? Kiểm chứng bằng `bench` thay vì đoán |
| **Security** | Có validate input không (`whitelist`)? Lộ password hash/field nội bộ trong response? Kiểm tra quyền sở hữu resource (IDOR)? SQL ghép chuỗi? Secret hard-code? Log dữ liệu nhạy cảm? |
| **Testability** | Có test chưa (từ Q01)? Dependency có inject được để mock không? Hàm có phụ thuộc thời gian/random mà không tiêm vào được không? |

Đánh giá mỗi trục là ✅ / ⚠️ / ❌, kèm 1 câu giải thích. Trục nào không áp dụng (vd. Nest architecture ở Tier J) thì bỏ qua.

### 4. Phản hồi
Mẫu:
```
Kết quả: ❌ 4/6 test · fail "trả 404 khi đơn không tồn tại" (nhận 500)

Correctness   ❌  findOne trả undefined rồi truy cập .items → TypeError → 500
Edge cases    ⚠️  quantity = 0 vẫn được chấp nhận
Type safety   ⚠️  `as Order` che mất khả năng undefined
Nest arch     ✅  logic nằm trong OrdersService, controller mỏng
Performance   ⚠️  2 await tuần tự độc lập nhau (findUser, findProduct)

👉 Thử sửa lại. Gợi ý: repository trả gì khi không tìm thấy, và Nest có exception nào cho 404?
```
- Bài **sai**: KHÔNG đưa code đã sửa. Chỉ nêu vấn đề và đặt câu hỏi dẫn dắt.
- Bài **đúng**: **bắt buộc** nhận xét và nêu best practice, kể cả khi bài đã tốt. Gồm: điểm làm đúng; cách viết chuẩn nhất (nếu bài đã là best practice thì nói thẳng và vì sao; nếu còn cách tốt hơn thì **luôn kèm code mẫu đầy đủ trong khối ```ts/```js**, đã chạy thật và qua test, rồi 2–3 lý do: ý định rõ hơn, tránh bẫy, dễ test/bảo trì, đúng convention Nest; chỉ mô tả bằng lời mà không có code là chưa đạt); số đo so sánh (thời gian, RPS, p99) khi liên quan hiệu năng, ghi rõ giới hạn nếu chỉ đo 1 lần; và trade-off nếu bản của người học dễ đọc hơn hoặc khác biệt không đáng kể.
- Có nhiều vấn đề: chỉ nêu tối đa 3 vấn đề quan trọng nhất mỗi lượt.

### 5. Ghi nhận
- Lỗi thuộc dạng pattern (xem danh sách tag gợi ý đầu `progress/weaknesses.md`): thêm dòng mới hoặc tăng `count`.
- Tag dùng kebab-case, ngắn gọn. Trước khi tạo tag mới, kiểm tra xem đã có tag tương tự chưa để tái sử dụng.
