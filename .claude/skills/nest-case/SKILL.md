---
name: nest-case
description: |
  Bài tình huống thực tế mô phỏng công việc backend thật với NestJS: API chậm sau khi data tăng, event loop bị chặn, memory leak, N+1, race condition trừ tiền/tồn kho hai lần, lỗi circular dependency khi khởi động, refresh token bị lộ, job queue gửi email trùng, pool DB cạn. Người học điều tra và xử lý như kỹ sư trực sự cố.
  Triggers: /nest-case, "bài thực tế", "tình huống", "case study", "debug production", "incident"
---

# Nest Case: tình huống thực tế

Khác với lesson: đề **không nói trước** cần dùng kỹ thuật gì. Người học phải tự chẩn đoán.
Chọn case theo các module người học đã ✅. Case có thể vượt tối đa 1 tier để tạo độ khó, nhưng không vượt hơn. Bắt đầu dùng từ khi xong C06.

## Kho dạng case (chọn hoặc biến tấu)
| Nhóm | Ví dụ tình huống | Module liên quan |
|---|---|---|
| 💥 Crash / không khởi động | Deploy xong app không lên: "Nest can't resolve dependencies of OrdersService (?)". Hoặc app tự chết vì `unhandledRejection` lúc 3h sáng | C03, C04, C10, J11, N07 |
| 🐛 Sai dữ liệu | Khách bị tính giá sai vài đồng (float), đơn tạo lúc 23h hiện sang ngày hôm sau (timezone), response trả `password` | J07, R09, A01, C08 |
| 🐢 API chậm | `GET /orders` mất 4s sau khi data tăng gấp 10. Cho log SQL và code, hãy tìm và sửa | B02, B04, B07, P05 |
| 📈 Tăng trưởng | "Ở local chạy ngon, lên production với 200 user đồng thời thì timeout hàng loạt." Tìm nút thắt (pool, event loop, gọi ngoài không timeout); chứng minh bằng `bench` | P05, P09, B05 |
| 🧊 Event loop bị chặn | Một endpoint export CSV làm mọi endpoint khác chậm theo | N01, N03, N06, P06 |
| 🫗 Memory leak | RAM tăng đều tới khi bị OOM kill sau ~6h. Cho heap snapshot | P06, J13 |
| 🔒 Concurrency | Flash sale bán vượt tồn kho; bấm "Thanh toán" 2 lần bị trừ tiền 2 lần | B05, R02, R08 |
| 📬 Queue | Khách nhận 5 email giống nhau; job "đóng đơn hết hạn" chạy 3 lần khi scale lên 3 instance | P03, R04, M08 |
| 🔐 Bảo mật | User A xem được đơn của user B bằng cách đổi id; refresh token cũ vẫn dùng được sau khi đổi mật khẩu; `isAdmin: true` gửi kèm body được chấp nhận | A02, A04, A06, C05 |
| 🏗️ Migration | Thêm cột NOT NULL vào bảng 1M dòng làm API treo khi deploy; đổi tên field làm app cũ đang chạy lỗi | B03, P07 |

## Cấu trúc thư mục
```
cases/<NN>-<slug>/
  BRIEF.md        # bối cảnh dạng ticket/incident: triệu chứng, log, số liệu, áp lực thời gian
  setup/          # dựng hiện trường: patch/branch cho shop-api có cài sẵn bug, seed data, script tạo tải
  notes.md        # người học ghi lại quá trình điều tra
  solution/       # cách xử lý của người học (hoặc commit trong shop-api, ghi hash vào notes.md)
  postmortem.md   # Claude viết sau khi xong: root cause, cách sửa, cách phòng ngừa, các cách làm khác
```
Dựng hiện trường trên một branch riêng của `shop-api` (vd. `case/03-oversell`) để không làm bẩn code chính. Nhắc người học quay về branch chính sau case.

## Diễn biến
1. **Brief**: viết như ticket thật (Jira/Slack từ PM hoặc alert từ monitoring), có triệu chứng, chưa có nguyên nhân. Có thể kèm log JSON, stack trace, bảng bench, heap snapshot.
2. **Điều tra**: người học đặt câu hỏi, đọc log, chạy lệnh chẩn đoán, đặt breakpoint. Claude đóng vai đồng nghiệp hoặc hệ thống: trả lời trung thực về những gì quan sát được và không tiết lộ root cause.
3. **Tái hiện**: viết test hoặc kịch bản `bench`/script gửi request đồng thời để thấy lỗi tận mắt. Case concurrency: dùng `autocannon` hoặc `Promise.all` 50 request cùng lúc.
4. **Xử lý**: người học sửa code. Chạy lại kịch bản tái hiện để xác nhận lỗi đã hết, và thêm 1 test hồi quy. Nếu là case hiệu năng: đo trước/sau bằng `bench` trên ít nhất 2 mức tải hoặc dữ liệu, lưu bảng kết quả vào thư mục case.
5. **Postmortem**: viết `postmortem.md` theo khung root cause → fix → phòng ngừa (test, lint rule, monitoring/alert, review checklist) → các phương án khác và trade-off.
6. Cập nhật tracker (ghi vào nhật ký với tag `case`) và weaknesses.

Chấm theo 4 tiêu chí, thang 1–5 mỗi tiêu chí: quy trình chẩn đoán có hệ thống không (giả thuyết → bằng chứng), root cause đúng không, fix có an toàn với production không (tương thích ngược, migration, rollback), và có phòng ngừa tái diễn không (test hồi quy, alert).
