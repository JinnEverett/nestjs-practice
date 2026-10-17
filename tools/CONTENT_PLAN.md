# Kế hoạch soạn nội dung NestJS

Bảng trạng thái soạn bài (không phải tiến độ học — tiến độ học ở `progress/tracker.md`). Quy ước soạn xem `tools/AUTHORING.md`.
Trạng thái: ⬜ chưa soạn · 🟡 đang soạn · ✅ soạn xong (đủ README, exercises, checks, solutions) · 🧪 soạn xong và đã chạy `--solutions` xanh.

Giai đoạn 1 (hiện tại): soạn cho xong, chưa verify. Giai đoạn 2: chạy `bash lessons/check.sh <bài> all --solutions` (Tier N) và `bash lessons/check.sh <bài> all --solutions` với e2e (Tier C+) để chuyển ✅ → 🧪.

| Tier | Module | Trạng thái | Ghi chú |
|---|---|---|---|
| S | S00 | ⬜ | hạ tầng đã có (env, bench, check.sh, _sample); thiếu README buổi |
| J | J01–J14 | 🧪 | có từ trước |
| T | T01–T07 | ✅ | có từ trước |
| N | N01–N07 | ⬜ | |
| C | C01–C12 | ⬜ | |
| Q | Q01–Q04 | ⬜ | |
| B | B01–B09 | ⬜ | |
| A | A01–A06 | ⬜ | |
| P | P01–P09 | ⬜ | |
| R | R01–R10 | ⬜ | |
| M | M01–M09 | ⬜ | |
| D | D01–D08 | ⬜ | thư mục `designs/` |
| CAP | CAP | ⬜ | |

(Bảng chi tiết từng module được cập nhật khi soạn xong từng tier.)
