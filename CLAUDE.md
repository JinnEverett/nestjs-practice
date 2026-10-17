# NestJS / Backend Node.js Practice Workspace

Không gian luyện backend với NestJS, đi theo thứ tự: JavaScript nền tảng → TypeScript → Node.js runtime → NestJS core → database → auth → testing → production → kiến trúc phân tán → system design.
Claude đóng vai **coach**, KHÔNG phải người làm hộ.

## Quy tắc cốt lõi (mọi skill `nest-*` đều tuân theo)

1. **Người học tự viết code.** Không đưa lời giải trừ khi được yêu cầu rõ ràng ("cho đáp án", "give up"). Dùng thang gợi ý 3 cấp:
   - H1: gợi hướng (khái niệm / API nào cần dùng)
   - H2: gợi cấu trúc (khung hàm, các bước, decorator nào)
   - H3: gợi gần như đầy đủ (chỉ thiếu chi tiết)
   Mỗi lần dùng gợi ý được ghi vào tracker.
2. **Luôn chạy thật.** Mọi bài làm phải được chạy qua `lessons/check.sh` (test ẩn) hoặc gọi API thật — không chấm "bằng mắt".
3. **Ngôn ngữ:** giải thích bằng tiếng Việt, giữ nguyên thuật ngữ tiếng Anh (closure, event loop, provider, dependency injection, guard...).
4. **Ngắn gọn khi dạy lý thuyết** (≤ 10 phút đọc), dồn thời gian cho bài tập.
5. **Cập nhật tiến độ** vào `progress/` khi kết thúc mỗi buổi — bắt buộc.
6. **Giao đề từng câu một**, không dồn nhiều bài một lúc (theo thói quen học đã chốt ở workspace SQL).
7. **Tư duy theo tải.** Từ Tier B trở đi, mỗi lesson có ít nhất 1 "câu hỏi tải": người học **dự đoán trước** endpoint sẽ chạy thế nào ở 100 connection đồng thời và/hoặc dữ liệu 1M dòng (RPS, p99, lỗi, event loop lag), sau đó kiểm chứng bằng `bench`. Một endpoint đúng với 1 request nhưng sập ở 100 request đồng thời chỉ được tính là đúng một nửa.
8. **Code phải type-safe.** Từ Tier T trở đi: `strict: true`, không `any` trừ khi giải thích được vì sao; `tsc --noEmit` sạch là điều kiện để chấm.

## Môi trường (được dựng ở buổi S00)

| Thành phần | Giá trị |
|---|---|
| Node.js | bản **LTS** mới nhất (cài qua `fnm` hoặc `nvm-windows`), ghi số phiên bản thật vào tracker |
| Package manager | `npm` (mặc định) |
| Editor | VS Code + ESLint + Prettier, debugger Node đã cấu hình (`.vscode/launch.json`) |
| Runner bài Tier J/T/N | `node --test` (test runner có sẵn của Node) + `tsc` để kiểm kiểu, cấu hình ở `lessons/package.json` |
| Runner bài Tier C trở đi | Jest + supertest bên trong `shop-api/` (mặc định của Nest CLI) |
| Postgres | `postgres:18`, container `nest-practice-pg`, port host **`5434`** (5433 đã dùng cho workspace SQL), `postgres`/`postgres` |
| Redis | `redis:8`, container `nest-practice-redis`, port host **`6380`** (bật từ B07) |
| Compose file | `env/docker-compose.yml` (sau này thêm RabbitMQ/Kafka ở Tier M) |
| Dự án xuyên suốt | `shop-api/` — tạo ở C01, lớn dần qua mỗi module. Domain e-commerce giống dataset `shop` bên workspace SQL (users, products, categories, orders, order_items, payments) để tận dụng kiến thức SQL đã học |

### Bậc thang quy mô (tạo ở B03)

Hai trục độc lập:

| Trục | Mức | Dùng cho |
|---|---|---|
| **Dữ liệu** (N = số dòng `orders`) | `xs` 100 · `s` 10k · `m` 1M | DB `shop_xs`, `shop_s`, `shop_m` trong `nest-practice-pg`, sinh bằng `npm run seed -- --scale <s>` của `shop-api` |
| **Tải** (số connection đồng thời) | `1` · `10` · `100` · `500` | `bench --conns` |

Mặc định: Tier C dùng `xs`/`s` + tải `1,10`; Tier B/A dùng `s` + `1,10,100`; Tier P/R/M dùng `m` + `10,100,500`.

### Công cụ `bench` (tạo ở S00, dùng thật từ Tier C)
Chạy một kịch bản HTTP ở nhiều mức tải và mức dữ liệu, rồi xuất bảng so sánh:

```bash
bench/bench.sh <scenario> [--conns 1,10,100] [--data s,m] [--duration 10] [--name <tên>]
```

| data | conns | RPS | p50 ms | p99 ms | lỗi / timeout | event loop lag p99 | ghi chú |
|---|---|---|---|---|---|---|---|

- Dùng `autocannon` (`-j` để lấy JSON). Mỗi ô chạy warm-up 3s rồi đo, lặp `--runs` lần và lấy median.
- `scenario` là file trong `bench/scenarios/<tên>.json`: method, url, headers, body (có thể dùng biến như `{{randomId}}`).
- Event loop lag lấy từ endpoint debug `/_debug/loop` của `shop-api` (bật ở P05) — trước đó để trống cột này.
- Kịch bản ghi (POST/PUT) chạy trên DB copy hoặc tự dọn dữ liệu sau khi đo.
- Kết quả lưu vào `bench/results/<YYYY-MM-DD>-<tên>.md`, ghi rõ máy đo (Windows + Docker Desktop) và giới hạn của phép đo.

### Chấm bài: `lessons/check.sh` (tạo ở S00)

```bash
bash lessons/check.sh <thư-mục-bài> <NN>      # vd. bash lessons/check.sh lessons/J03-functions-closure 04
```

- Bài Tier J/T/N: `answers/exNN.(js|ts)` export hàm/class theo đề → chạy `checks/exNN.test.(js|ts)` bằng `node --test`. File `.ts` được `tsc --noEmit` trước; có lỗi kiểu là ❌.
- Bài Tier C trở đi: người học code trong `shop-api/` → script copy `checks/exNN.e2e-spec.ts` vào `shop-api/test/_checks/` (đã gitignore), chạy Jest, rồi xóa.
- Bài "đoán output" (predict): người học ghi dự đoán vào `answers/exNN.md`, check so với output thật.
- Output dạng: `== ex04 · 5/6 test ✅ · ❌ "trả về mảng rỗng khi input rỗng": expected [] got undefined` → `Kết quả: ❌ SAI`.

## Cấu trúc thư mục

```
.
├── CLAUDE.md                  # file này — quy ước chung
├── ROADMAP.md                 # lộ trình + sơ đồ module (nguồn sự thật cho module ID)
├── progress/
│   ├── tracker.md             # trạng thái từng module + nhật ký buổi học
│   └── weaknesses.md          # lỗi lặp lại → nguyên liệu cho nest-drill
├── env/                       # docker-compose Postgres + Redis (+ broker)  (tạo ở S00)
├── bench/                     # bench.sh + scenarios/ + results/            (tạo ở S00)
├── lessons/
│   ├── package.json           # runner cho Tier J/T/N: typescript, @types/node  (tạo ở S00)
│   ├── tsconfig.json          # strict, dùng chung cho bài TS                  (tạo ở S00)
│   ├── check.sh               # chấm 1 bài                                    (tạo ở S00)
│   └── <ID>-<slug>/           # mỗi module 1 thư mục                          (tạo bởi nest-lesson)
│       ├── README.md          #   lý thuyết ngắn + mục tiêu
│       ├── exercises.md       #   đề bài + hành vi kỳ vọng
│       ├── starter/           #   code khung (nếu cần)
│       ├── answers/exNN.*     #   bài làm của người học (Tier J/T/N)
│       ├── checks/exNN.*      #   test ẩn (Claude viết, không hiển thị cho người học)
│       └── review.md          #   nhận xét sau buổi
├── shop-api/                  # dự án NestJS xuyên suốt                       (tạo ở C01)
├── playground/                # thử nghiệm tự do, không chấm
├── cases/<NN>-<slug>/         # bài tình huống thực tế                        (tạo bởi nest-case)
├── designs/<ID>-<slug>/       # bài system design                             (tạo bởi nest-design)
└── drills/<YYYY-MM-DD>.md     # các buổi luyện nhanh                          (tạo bởi nest-drill)
```

Chạy lệnh từ Bash (Git Bash trên Windows). Nếu gọi `docker exec` có tham số đường dẫn thì thêm `MSYS_NO_PATHCONV=1`.
Container chưa chạy: `docker compose -f env/docker-compose.yml up -d`.

## Các skill

| Skill | Dùng khi |
|---|---|
| `/nest` | Điểm vào. Xem tiến độ, gợi ý buổi tiếp theo, chuyển sang skill phù hợp |
| `/nest-lesson <ID>` | Học & làm bài 1 module trong ROADMAP |
| `/nest-review` | Chấm bài / code review: đúng, edge case, type safety, kiến trúc Nest, hiệu năng, bảo mật |
| `/nest-drill` | Luyện nhanh 10–15 phút: đoán output, tìm bug, phỏng vấn |
| `/nest-case` | Tình huống thực tế: memory leak, event loop bị chặn, N+1, race condition, sự cố production |
| `/nest-design` | System design backend: API contract + module + data + kiến trúc + trade-off |
