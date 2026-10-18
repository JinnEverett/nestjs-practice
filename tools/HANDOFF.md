# Bàn giao: việc còn lại (cập nhật 2026-10-18, sau khi merge Nestjs #3 và Sql #4)

Ghi chú để quay lại làm tiếp. Trạng thái chi tiết từng module nằm ở `tools/CONTENT_PLAN.md` và `tools/reports/b.md`; file này chỉ liệt kê **việc cần làm** và **những thứ cần lưu ý trước khi làm**.

## 1. Việc ngay khi quay lại (B03 chưa kiểm chứng xong)
Làm theo thứ tự. Cần máy còn RAM (lần trước tác vụ nặng bị hệ thống dừng vì thiếu RAM): đóng bớt ứng dụng, chạy **từng lệnh một**, không chạy song song (các lệnh dùng chung `lessons/.shop-ref/` và DB `shop_test`).

1. Chạy trọn bộ B03 một lượt:
   `bash lessons/check.sh lessons/B03-migrations-seed all --solutions`
   Kỳ vọng 8 file, 40 test xanh (ex01 6, ex02 5, ex03 4, ex04 6, ex05 4, ex06 8, ex07 3, ex08 4). Lý do cần: sau các lần chạy riêng lẻ còn hai chỉnh sửa chưa chạy lại cùng nhau (entity `attributes` đổi `default` thành `"'{}'"`; ex04 siết chỉ xét thân `up()` của migration).
2. Chạy 5 đột biến còn lại của `seed.ts` (danh sách trong phần 4 của file này). Mỗi đột biến: sửa `lessons/B03-migrations-seed/solutions/scripts/seed.ts`, chạy `bash lessons/check.sh lessons/B03-migrations-seed 06 --solutions`, **kỳ vọng đỏ**, rồi khôi phục file. Đột biến nào vẫn xanh nghĩa là check quá lỏng, hãy siết.
3. Chạy lại đột biến "index không CONCURRENTLY" với ex04 mới: kỳ vọng đỏ.
4. Đổi trạng thái B03 trong `tools/CONTENT_PLAN.md` từ ✅ sang 🧪 và bỏ mục "Trạng thái kiểm chứng B03" trong `tools/reports/b.md`.
5. (Tùy chọn, khi ổ C còn trống ≥ 3 GB) sinh thật `npm run seed -- --scale m --yes`, ghi thời gian và dung lượng vào báo cáo. Hiện `--scale m` mới kiểm cơ chế `--yes`, chưa sinh thật.

## 2. Module Nestjs chưa soạn (theo thứ tự đề xuất)
| Nhóm | Module | Ghi chú |
|---|---|---|
| B | B04 QueryBuilder, báo cáo, keyset · B05 Transaction, khóa, retry deadlock, CLS (**chuyển đơn hàng từ RAM sang DB**, thêm `include=items` cho đơn) · B06 Layering (ranh giới entity/domain/mapper) · B07 Redis cache · B08 Prisma/Drizzle (dự án so sánh riêng, không overlay) · B09 MongoDB (tùy chọn) | B04 sửa nút cổ chai `findAll()` đã đo ở B01 ex09 (1 nghìn dòng chậm 15×, 100 nghìn timeout) |
| A | A01–A06 | A01 thêm cột `password_hash` vào `users` (migration mới, timestamp > `1760000000004`) |
| P | P01–P09 | |
| R | R01–R10 | |
| M | M01–M09 | |
| D | D01–D08 (thư mục `designs/`) · CAP | |

## 3. Quy ước và cái bẫy đã gặp (đọc trước khi soạn module mới)
- Đọc `lessons/_shop-api/CONTRACT.md` mục 6b–6e (bề mặt đã có) và mục 7 (testkit). Module nào thay schema thì viết **migration mới**, không sửa migration cũ.
- Quy trình mỗi module: đáp án mẫu (`solutions/` là overlay) → check e2e → chạy `--solutions` xanh → **phép thử đột biến** (phá từng yêu cầu của đáp án, xác nhận check đỏ; script nằm ngoài repo, xem mô tả ở `tools/reports/b.md`) → README/đề → số đo thật cho bài 📏 → cập nhật `CONTRACT.md`, `CONTENT_PLAN.md`, `reports/b.md`.
- Trước mỗi lần chạy check của module thay đổi schema, check phải gọi `freshDatabase()` (xóa sạch schema `public`) vì thêm khóa ngoại/ràng buộc lên DB còn dữ liệu cũ làm ứng dụng không khởi động.
- Không dùng `node -e "..."` lồng nhiều lớp quote để sửa file có regex hay `$`: nó làm hỏng file (đã xảy ra 3 lần). Dùng Write/Edit hoặc một file `.mjs`.
- Hai tiến trình đo/benchmark không được chạy chồng trên cùng DB. Nhớ `GetCacheInterceptor` cache GET (`@CacheTtl`) làm sai số đo: thêm tham số ngẫu nhiên ngoài khoảng dữ liệu vào URL.
- Lệnh có `docker rm`/`docker network rm` lồng trong `bash -c`/script đôi khi bị bộ chặn của Claude Code từ chối; chạy từng lệnh đơn lẻ.
- Tên file khai báo script npm là `NPM_SCRIPTS` (không phải `SCRIPTS`: trùng thư mục `scripts/` trên Windows).

## 4. Danh sách đột biến seed chưa chạy (B03 ex06)
Sửa `solutions/scripts/seed.ts` rồi chạy ex06, kỳ vọng đỏ:
1. Thay hàm băm `hashtextextended(...)` trong `h` bằng `random()` (seed không tất định).
2. `total_amount = t.sub + t.ship - t.disc` → bỏ `- t.disc` (tổng tiền bỏ qua giảm giá).
3. Vòng `for (const t of ['categories', 'users', 'products', 'orders'])` → mảng rỗng (quên `setval`).
4. Bỏ câu `TRUNCATE ...` (chạy lại nhân đôi dòng).
5. `if (args.scale === 'm' && !args.yes) fail(...)` → `if (false)` (m không cần `--yes`).

## 5. Các repo khác (cập nhật cùng ngày)
- **Nestjs:** PR #3 (`content/b`: B01, B02, B03, sửa Q02, hạ tầng testkit) **đã merge vào `main`**. Workspace chưa có `shop-api/` của người học, nên mọi kiểm chứng đều chạy qua `--solutions`, chưa qua `answers`.
- **Sql:** PR #4 (`content/o`: I08, I09, O01–O06) **đã merge vào `main`**; đã verify 34 đạt, 29 tự đối chiếu, 0 lỗi. Còn nhánh remote `content/o` cho tới khi merge. Lưu ý `tools/reports/o.md` ghi một sự cố: dồn ~100 kết nối sát giới hạn vào `sql-practice-pg` làm server tự restart một lần (đã tự phục hồi, không mất dữ liệu); thí nghiệm tương tự chỉ làm trên container tạm.
- **Dsa:** đã soạn đủ và đã merge. Nhánh remote `content/d`, `content/i` là bản nháp cũ chưa merge (có thể xóa sau khi xác nhận).
- **Ielts, System Design:** không có việc gì.
