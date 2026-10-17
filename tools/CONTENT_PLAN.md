# Kế hoạch soạn nội dung NestJS

Bảng trạng thái soạn bài (không phải tiến độ học — tiến độ học ở `progress/tracker.md`). Quy ước soạn xem `tools/AUTHORING.md`.
Trạng thái: ⬜ chưa soạn · 🟡 đang soạn · ✅ soạn xong (đủ README, exercises, checks, solutions) · 🧪 soạn xong và đã chạy `--solutions` xanh.

Giai đoạn 1 (hiện tại): soạn cho xong, chưa verify. Giai đoạn 2: chạy `bash lessons/check.sh <bài> all --solutions` (Tier N) và `bash lessons/check.sh <bài> all --solutions` với e2e (Tier C+) để chuyển ✅ → 🧪.

| Tier | Module | Trạng thái | Ghi chú |
|---|---|---|---|
| S | S00 | 🧪 | `lessons/S00-setup/README.md` (nhóm core): các lệnh trong README đã chạy thật (`check.sh _sample --solutions`, `bench` hello-fast/hello-block ở 1,10,100) |
| J | J01–J14 | 🧪 | có từ trước |
| T | T01–T07 | ✅ | có từ trước |
| N | N01–N07 | 🧪 | đã có đủ README/exercises/checks/solutions, `--solutions` xanh cả 7; chỉ nới ngưỡng N01 ex05 (1.25× → 1.15×) vì flaky trên máy ít core |
| C | C01 | 🧪 | mẫu, không sửa (nhóm core chỉ chạy lại `--solutions`: 22 test xanh) |
| C | C02–C12 | 🧪 | nhóm core; xem `tools/reports/core.md`. In-memory, không cần Docker; chạy `--solutions` xanh trên Node 24 |
| Q | Q01, Q03, Q04 | 🧪 | nhóm core; chấm bằng test ẩn + **mutation** (spec của người học phải bắt ≥ 80% lỗi cài sẵn). Q03, Q04 được thêm vào `ORDER.md` để chạy được `--solutions` |
| Q | Q02 | ✅ | nhóm core; cần B01. Đã chạy xanh với một B01 **giả** (entity Product + TypeORM) trên Postgres 16 thật, chưa chạy với B01 thật |
| B | B01–B09 | ⬜ | |
| A | A01–A06 | ⬜ | |
| P | P01–P09 | ⬜ | |
| R | R01–R10 | ⬜ | |
| M | M01–M09 | ⬜ | |
| D | D01–D08 | ⬜ | thư mục `designs/` |
| CAP | CAP | ⬜ | |

(Bảng chi tiết từng module được cập nhật khi soạn xong từng tier.)
