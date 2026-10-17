# Quy ước soạn bài (dành cho coach / người soạn)

Áp dụng cho mọi module chưa có sẵn. Mẫu tham chiếu: `lessons/J10-async-promise` (Tier J/T/N), `lessons/T07-mini-framework` (bài chia bước dùng chung thư mục đáp án).

## 1. Tier N (runner `node --test`) — giống J/T

```
lessons/<ID>-<slug>/
  README.md         # ≤ 10' đọc: mục tiêu, khái niệm + ví dụ chạy được, bẫy, "Bên trong Nest dùng cái này ở đâu"
  exercises.md      # 8–10 bài 🟢🟡🔴 (một số 🔮 đoán output / 🐞 sửa bug), có 📏 câu hỏi quy mô nếu hợp
  starter/          # code khung cho bài 🔮/🐞
  answers/.gitkeep  # người học viết bài
  checks/exNN.test.(js|ts)   # test ẩn, node:test + node:assert/strict, tên test tiếng Việt
  solutions/exNN.(js|ts|txt|md)   # đáp án tham chiếu — coach tự chạy bằng check.sh --solutions
```
- Bài 🔮: `checks/exNN.test.js` gọi `predictTest(import.meta.url, 'exNN')` (`lessons/_lib/predict.js`); đáp án `solutions/exNN.txt` lấy từ **output thật** (chạy `node starter/exNN.js`), không tự suy.
- Mỗi bài có chữ ký export rõ ràng trong `exercises.md`; test ẩn kiểm cả edge case và bất biến.
- Test thời gian dùng ngưỡng rộng (≥ 2×) để không flaky.

## 2. Tier C trở đi — e2e trên `shop-api`

Người học viết code trong `shop-api/` (workspace root). Bài chấm bằng **e2e test ẩn** chạy bằng Jest + supertest.

```
lessons/<ID>-<slug>/
  README.md
  exercises.md      # mỗi bài: endpoint (method+path), request mẫu, response mẫu (status+body), các lỗi bắt buộc, file/module cần tạo
  starter/          # (tùy) patch/skeleton/fixture copy vào shop-api
  checks/exNN.e2e-spec.ts   # test ẩn (Jest + supertest), dùng helper của _shop-api/testkit
  solutions/        # OVERLAY: cây thư mục tương đối với shop-api/ (src/..., test/..., migrations/...)
  solutions/DEPS    # (tùy) gói npm cần cài: mỗi dòng "dependencies|dev  tên@range"
  answers/.gitkeep  # không dùng ở Tier C+ (code ở shop-api/); giữ cho đồng nhất
```
- **Hợp đồng chung** của `shop-api` (domain, quy ước đường dẫn, test helper, thứ tự module) nằm ở `lessons/_shop-api/CONTRACT.md`. Mọi bài C+ tuân theo hợp đồng này; đề bài chỉ nêu phần **thêm** của module.
- **Overlay**: mỗi module chứa phần file mà lời giải của nó **thêm hoặc ghi đè** lên `shop-api`. Áp dụng tích lũy theo thứ tự trong `lessons/_shop-api/ORDER.md` thì ra `shop-api` tham chiếu ở trạng thái ngay sau module đó. Check chạy trên trạng thái đó; module sau có thể làm hỏng check của module trước (vd. guard toàn cục) — bình thường, không chạy lại.
- **Không dùng service bên ngoài ngoài những gì `env/docker-compose.yml` cung cấp** (Postgres 5434, Redis 6380, RabbitMQ profile `broker`). Dịch vụ ngoài khác (OAuth provider, cổng thanh toán, S3…) được giả lập trong chính test (server `http` nhỏ, MinIO tùy chọn).
- Bài đo (Tier P, một phần B/R/M): `exercises.md` là danh sách thí nghiệm; check kiểm sự tồn tại và tính hợp lệ của số đo/kết quả (file `review.md` có bảng, endpoint debug trả đúng…), không kiểm con số tuyệt đối.
- Bài thiết kế (Tier D, một phần M, CAP): xem mục 3.

## 3. Tier D và CAP — `designs/`

```
designs/<ID>-<slug>/
  BRIEF.md          # đề 2–3 câu, cố ý mơ hồ (người học phải hỏi lại)
  INTERVIEWER.md    # (spoiler) ngân hàng câu hỏi phản biện theo từng bước 7 bước + "yêu cầu ngầm" cần khai thác
  REFERENCE.md      # (spoiler) thiết kế tham chiếu: 7 bước, sơ đồ mermaid, số ước lượng, trade-off, lỗi hay gặp
  RUBRIC.md         # điểm chấm riêng của đề (bổ sung rubric chung trong skill nest-design)
```
Coach không đọc `INTERVIEWER.md`/`REFERENCE.md` cho người học trước khi người học trình bày xong từng bước.

## 4. Nguyên tắc nội dung
- Tiếng Việt, giữ thuật ngữ tiếng Anh. Không dạy API đã deprecated. Phiên bản đã đối chiếu: **Node 24 LTS, NestJS 12 (CommonJS, Jest 30), TypeORM 1.x, TypeScript 5.9/6**. Nest 12 là gói ESM-only nhưng ứng dụng CommonJS vẫn dùng được qua `require(esm)`; Jest chạy được trên Node ≥ 24.9.
- Mỗi README nối khái niệm với "bên trong Nest dùng ở đâu" (Tier J/T/N) hoặc "dùng ở đâu trong `shop-api`" (Tier C+).
- Từ Tier B: ≥ 1 bài 📏 câu hỏi tải (dự đoán trước → `bench` → so sánh). Tier P: phần "Đo bằng gì".
- Đề bài đủ chặt: chữ ký/endpoint, ràng buộc, định dạng lỗi. Không liệt kê hết edge case — test ẩn kiểm.
- Lỗi tiền, thời gian, bảo mật phải có ít nhất một bài/test cài sẵn bẫy (float, timezone, IDOR…).
- `solutions/` là spoiler: coach chỉ mở sau khi người học qua check hoặc xin H3.
