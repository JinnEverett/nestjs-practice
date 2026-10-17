# Brief cho agent soạn bài (chạy trên cloud)

Bạn đang soạn **nội dung khóa học NestJS** trong repo này (workspace luyện backend bằng tiếng Việt). Mỗi agent nhận **một nhóm module** và làm trên **một branch riêng**.

## Đọc trước (bắt buộc, theo thứ tự)
1. `CLAUDE.md` — quy tắc coach/người học, môi trường.
2. `ROADMAP.md` — mục "Danh mục module": nội dung chính + tiêu chí Pass của từng module bạn được giao.
3. `tools/AUTHORING.md` — quy ước thư mục bài, file, cách đặt tên.
4. `lessons/_shop-api/CONTRACT.md` — hợp đồng chung của `shop-api` (route, tên, quy ước). **Không tự ý đổi**; cần đổi thì sửa CONTRACT trong cùng commit và nêu rõ trong báo cáo.
5. Một bài mẫu hoàn chỉnh để bắt chước văn phong và độ sâu:
   - Tier N (runner `node --test`): `lessons/N04-http/` (README, exercises, checks, solutions).
   - Tier C trở đi (e2e): `lessons/C01-cli-structure/` + hạ tầng `lessons/_shop-api/` (`e2e.sh`, `assemble.mjs`, `testkit/_kit.ts`, `ORDER.md`, `VERSIONS.md`).
6. `.claude/skills/nest-lesson/SKILL.md` — yêu cầu về README (≤ 10' đọc, ví dụ chạy được, bẫy, "bên trong Nest dùng cái này ở đâu"), exercises (🟢🟡🔴, một bài mỗi mục, câu hỏi tải 📏 từ Tier B), test ẩn.

## Mỗi module bạn soạn phải có
```
lessons/<ID>-<slug>/
  README.md            # tiếng Việt, giữ thuật ngữ tiếng Anh, ≤ 10' đọc
  exercises.md         # 6–10 bài; endpoint + request/response mẫu + lỗi bắt buộc + file/tên cần tạo
  checks/exNN.e2e-spec.ts   # test ẩn (Jest + supertest); .needs-db / .needs-redis nếu cần
  solutions/           # OVERLAY lên shop-api (cây thư mục tương đối), + solutions/DEPS, + solutions/_answers/ cho bài 🔮
  answers/.gitkeep
```
Slug: dùng chữ thường, gạch ngang, bám tên chủ đề trong ROADMAP (vd. `C02-controllers`).
Cập nhật `lessons/_shop-api/ORDER.md` nếu thêm module chưa có trong danh sách.

## Quy tắc chất lượng
- **Test ẩn phải chặt và công bằng**: chỉ dựa vào bề mặt ổn định (CONTRACT mục 1) và tên/đường dẫn được `exercises.md` chỉ định. Không kiểm chi tiết cài đặt không được nêu.
- Mỗi module có ít nhất một bài **bẫy** thật (float tiền, timezone, IDOR, race condition, N+1, lộ dữ liệu…) và bài 🔴 viết bằng ngôn ngữ nghiệp vụ ("Team mobile báo…").
- Tier B trở đi: ≥ 1 bài **📏 câu hỏi tải** (người học dự đoán rồi chạy `bench/bench.sh`; check chỉ kiểm tồn tại/hợp lệ của kết quả trong `review.md` nếu có, không kiểm con số).
- API thư viện phải đúng phiên bản trong `lessons/_shop-api/VERSIONS.md` (Nest 12, TypeORM 1.x, Jest 30, TS 6…). **Đối chiếu tài liệu chính thức** khi không chắc; không dạy API đã deprecated. Nest 12: `HealthIndicatorService` thay `HealthIndicator`; TypeORM 1.x: `relations`/`select` dạng object, `where` với `null` ném lỗi, `setLock('pessimistic_write').setOnLocked(...)`.
- Đáp án (`solutions/`) phải **chạy được** và qua mọi check của module. Nếu bạn không chạy được môi trường (Docker, Postgres), vẫn soạn đầy đủ nhưng ghi rõ trong báo cáo module nào **chưa verify**.
- Không đưa nội dung bí mật. Không gọi dịch vụ ngoài internet trong check.
- Văn phong: ngắn gọn, số liệu cụ thể, không khen chung chung; tiếng Việt, giữ thuật ngữ tiếng Anh.

## Cách verify (nên làm nếu cloud có Node 24 + Docker)
```bash
cd lessons && npm ci          # runner chung (Tier J/T/N)
cd .. && bash lessons/check.sh lessons/<ID>-<slug> all --solutions
# Tier C+ lần đầu sẽ tự dựng lessons/.shop-ref/ (npm install), chậm vài phút
# Bài cần DB: docker compose -f env/docker-compose.yml up -d postgres redis
```
Nếu một module ở tier trước (của agent khác) chưa có `solutions/`, `assemble.mjs` bỏ qua nó — check của module bạn có thể cần phần đó; khi đó ghi chú trong báo cáo thay vì tự viết hộ module của agent khác.

## Git
- Branch của bạn: `content/<nhóm>` (xem bảng phân công trong prompt). Commit nhỏ theo module: `feat(C03): providers & DI`. **Không** đổi file của module ngoài nhóm của bạn trừ `ORDER.md` và `CONTRACT.md` (mục 6, 7).
- Đẩy branch lên remote khi xong từng module (push thường xuyên để không mất việc).
- Cuối cùng cập nhật `tools/CONTENT_PLAN.md` (dòng của nhóm bạn: ✅ hoặc 🧪 nếu đã verify) và viết `tools/reports/<nhóm>.md`: danh sách module, bài nào đã verify, bài nào chưa, quyết định thiết kế đáng chú ý, thay đổi CONTRACT.
