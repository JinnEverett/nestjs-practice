---
name: nest-lesson
description: |
  Dạy và cho luyện một module trong ROADMAP.md (S00, J01…J14, T01…T07, N01…N07, C01…C12, Q01…Q04, B01…B09, A01…A06, P01…P09, R01…R10, M01…M09). Tạo thư mục bài, viết lý thuyết ngắn, ra đề tăng dần độ khó, viết test ẩn, chạy bài làm thật và chấm.
  Triggers: /nest-lesson <ID>, "học module J03", "bài tiếp theo", "học closure", "dạy tôi về dependency injection", "học guard"
---

# Nest Lesson: một buổi học theo module

Input là module ID (vd. `J03`, `C07`). Nếu người học gọi bằng chủ đề thì tra `ROADMAP.md` để tìm ID tương ứng.
Tuân thủ toàn bộ quy tắc trong `CLAUDE.md`, đặc biệt là: **người học tự viết code**, **luôn chạy thật**, **giao đề từng câu một**.

## 0. Chuẩn bị
- Đọc dòng của module trong `ROADMAP.md` (nội dung chính, tiêu chí Pass).
- Đọc tracker và weaknesses. Lỗi nào liên quan đến module này thì lồng vào bài tập.
- Nếu `lessons/<ID>-*/` đã tồn tại thì đây là buổi **học tiếp**: đọc `review.md` và các `answers/` cũ (hoặc git diff trong `shop-api/`), rồi bắt đầu từ bài chưa làm.
- Đổi trạng thái module trong tracker thành 🟡.
- Kiểm tra API của thư viện trước khi viết bài (Nest, TypeORM, BullMQ… đổi API qua các major version): xem phiên bản trong `shop-api/package.json` và đối chiếu tài liệu chính thức nếu không chắc. Không dạy API đã deprecated.

## 1. Warm-up (≤ 5')
2–3 câu hỏi ngắn lấy từ module trước hoặc từ weaknesses. Ưu tiên dạng "đoán output" hoặc "tìm bug" vài dòng. Người học trả lời ngay trong chat.

## 2. Tạo thư mục bài
```
lessons/<ID>-<slug>/
  README.md        # lý thuyết cô đọng + mục tiêu buổi
  exercises.md     # đề bài
  starter/         # code khung nếu cần (Tier J/T/N: file có sẵn chữ ký hàm; Tier C+: patch/skeleton cho shop-api)
  answers/         # người học ghi bài vào đây (Tier J/T/N) — Tier C+ code nằm trong shop-api/
  checks/          # test ẩn do Claude viết
```

### README.md (đọc trong ≤ 10')
- Mục tiêu: 3–5 gạch đầu dòng, viết dạng "sau buổi này bạn làm được…".
- Khái niệm: mỗi ý gồm 1 đoạn giải thích và 1 ví dụ **chạy được** (`node file.js` hoặc gọi endpoint bằng `curl`).
- Bẫy hay gặp: 3–5 bẫy, mỗi bẫy kèm code sai và code đúng.
- "Bên trong Nest dùng cái này ở đâu": với Tier J/T/N, nối khái niệm với chỗ Nest dùng nó (closure → factory provider, `this` → method truyền làm callback, decorator → `@Injectable`, event loop → vì sao không được chặn trong handler). Đây là sợi chỉ xuyên suốt cho tới Tier C.
- Với Tier P: thêm phần "Đo bằng gì" (bench, `monitorEventLoopDelay`, `--cpu-prof`, log, metric).

### exercises.md
Khoảng 8–12 bài, chia 3 mức:
- 🟢 Cơ bản: áp dụng trực tiếp khái niệm.
- 🟡 Kết hợp: phối hợp với kiến thức các module trước.
- 🔴 Thực tế: đề viết bằng ngôn ngữ nghiệp vụ ("Team mobile báo API trả 500 khi…", "PM muốn…"), có edge case ẩn.

Mỗi bài ghi rõ:
- **Tier J/T/N:** tên file `answers/exNN.js|ts`, chữ ký hàm/class phải export, 2–3 ví dụ input → output, ràng buộc (không mutate input, không dùng thư viện ngoài…). Không liệt kê hết edge case — test ẩn sẽ kiểm.
- **Tier C trở đi:** endpoint (method + path), request mẫu, response mẫu (status + body), các trường hợp lỗi bắt buộc (400/401/403/404/409), file/module nào cần tạo trong `shop-api`.
- **Dạng đặc biệt:**
  - 🔮 *Đoán output* (J10, J11, N01, C08): cho đoạn code, người học ghi dự đoán vào `answers/exNN.md` **trước khi chạy**.
  - 🐞 *Tìm & sửa bug*: đưa code có bug trong `starter/`, người học sửa.
  - Tier P trở đi: "tối ưu endpoint này" (đưa sẵn code chậm), "dự đoán số đo", "giải thích vì sao".

Chỉ hiển thị cho người học **một bài mỗi lần** (theo CLAUDE.md quy tắc 6). Có thể viết sẵn cả file exercises.md nhưng khi giao bài trong chat thì đưa từng bài.

**📏 Câu hỏi tải** (bắt buộc ≥1 bài từ Tier B, tùy chọn ở Tier C). Sau khi người học có lời giải đúng:
1. Hỏi người học dự đoán: "Ở 100 connection, data `m`, endpoint này đạt khoảng bao nhiêu RPS, p99 bao nhiêu, có lỗi không, nút thắt ở đâu?" Ghi dự đoán vào `review.md` (hoặc comment trong code) **trước khi** chạy bench.
2. Chạy `bench/bench.sh <scenario> --conns 1,10,100 --data s,m`.
3. So dự đoán với số đo. Chỉ ra điểm gãy (mức tải/dữ liệu nào mà p99 nhảy vọt hoặc bắt đầu có lỗi) và giải thích nguyên nhân (N+1, thiếu index, pool cạn, event loop bị chặn, serialize payload lớn).
4. Nếu lời giải sụp: người học sửa rồi đo lại. Bài chỉ được tính ✅ đầy đủ khi đạt ở cả hai mặt: đúng và chịu được tải (theo quy tắc 7 trong CLAUDE.md).
5. Bảng kết quả bench được dán vào `review.md`.

### checks/
Claude viết test ẩn. **Không hiển thị nội dung file này cho người học.**
- **Tier J/T/N:** `checks/exNN.test.(js|ts)` dùng `node:test` + `node:assert/strict`, import từ `../answers/exNN`. Mỗi test có tên tiếng Việt mô tả hành vi ("trả về [] khi input rỗng", "không mutate mảng đầu vào"). Bao phủ: case chính, edge case (rỗng, `null/undefined`, số âm, trùng), bất biến (không mutate, không gọi API thừa), với async: thứ tự, song song thật (đo thời gian), lỗi được reject đúng.
- **Bài type-level (T05):** `checks/exNN.test.ts` chứa `// @ts-expect-error` và kiểu kỳ vọng; chấm bằng `tsc --noEmit`.
- **Bài đoán output:** `checks/exNN.expected.txt` chứa output thật (chạy code để lấy, không tự suy).
- **Tier C trở đi:** `checks/exNN.e2e-spec.ts` dùng Jest + supertest, dựng `AppModule` thật (DB test), gửi request và kiểm status + body + side effect trong DB. Kiểm cả đường lỗi (validation, quyền, không tồn tại).
- **Luôn chạy test với lời giải tham chiếu của chính Claude** (viết ở thư mục tạm trong scratchpad, không để trong repo) để chắc test đúng trước khi giao bài.

## 3. Vòng luyện tập
Với từng bài:
1. Giao đề (một bài). Người học viết vào `answers/exNN.*` hoặc code trong `shop-api/` (hoặc dán vào chat; khi đó Claude lưu giúp vào đúng file).
2. Chạy `bash lessons/check.sh lessons/<ID>-<slug> NN`. Nếu lỗi cú pháp/kiểu, chỉ chỉ ra vị trí lỗi và thông điệp, không sửa hộ.
3. Sai: cho biết test nào fail, input gây fail và output thực tế (1 ví dụ) để người học tự tìm nguyên nhân. Không đưa code đã sửa.
4. Người học bí: dùng thang gợi ý H1 → H2 → H3 (xem CLAUDE.md), ghi lại số hint đã dùng.
5. Đúng: **bắt buộc** nhận xét và nêu best practice (xem bên dưới). Lỗi nào là pattern lặp lại thì ghi vào weaknesses.

### Nhận xét sau khi đúng (bắt buộc)
Mỗi bài người học làm đúng, đừng chỉ báo "✅ đúng". Luôn thêm phần nhận xét ngắn:
- **Làm đúng:** 2–3 điểm cụ thể (xử lý đúng edge case nào, tránh được bẫy nào).
- **Best practice:** cách viết chuẩn/idiomatic nhất cho đề này. Nếu bài làm đã là best practice thì nói thẳng "đây đã là cách chuẩn" và vì sao. Nếu còn cách tốt hơn thì **luôn kèm code mẫu đầy đủ trong khối ```js / ```ts** (bài đã đúng nên được phép đưa code), không chỉ mô tả bằng lời. Code mẫu phải đã chạy thật và qua hết test ẩn. Sau code, giải thích 2–3 lý do: ý định rõ hơn, tránh bẫy (mutate, mất `this`, quên await, N+1), dễ test/bảo trì, đúng convention Nest.
  - Mô tả bằng lời mà không có code là **chưa đạt** yêu cầu này. Nếu có hai hướng (vd. cách gọn hơn, và cách "chuẩn production" cần kiến thức chưa học), đưa code cho cả hai, ghi rõ hướng nào cần module nào.
  - Khi liên quan hiệu năng: kèm bảng so sánh ngắn (bản của bạn / bản mẫu): thời gian hoặc RPS/p99, ghi rõ nếu chỉ đo 1 lần.
- **Trade-off:** nếu bản của người học dễ đọc hơn hoặc khác biệt không đáng kể thì nói thẳng, không ép đổi.
- Giữ ngắn gọn, ưu tiên tối đa 3 điểm quan trọng nhất.

Không ra đề mới khi người học chưa nộp bài hiện tại, trừ khi người học muốn bỏ qua.

## 4. Kết thúc buổi
- Viết `review.md`: điểm (x/N), số hint, 3 điều nắm chắc, 3 điều cần cải thiện, các lỗi đã ghi vào weaknesses, bảng bench (nếu có).
- Cập nhật `progress/tracker.md`:
  - Đổi trạng thái thành ✅ nếu đạt tiêu chí Pass trong ROADMAP, ngược lại giữ 🟡.
  - Ghi điểm, số hint, ngày, và "Ôn lại lúc" (theo lịch trong skill `nest`).
  - Thêm một entry vào Nhật ký buổi học.
- Tier C trở đi: nhắc người học commit `shop-api` (vd. `feat(C05): validation pipes`). Không tự commit.
- Đề xuất buổi sau trong 1 dòng.

## Riêng S00 (Setup)
Buổi này dựng hạ tầng, không có bài tập code. Người học tự gõ lệnh cài đặt; Claude hướng dẫn và kiểm tra.
1. **Node.js:** cài `fnm` (hoặc `nvm-windows`), cài bản LTS mới nhất, `node -v`, `npm -v`. Giải thích Node là gì (runtime chạy JS ngoài trình duyệt), REPL (`node` rồi gõ thử), chạy file `node hello.js`. Ghi phiên bản vào bảng "Môi trường" trong tracker.
2. **VS Code:** extension ESLint, Prettier; `.vscode/launch.json` debug file JS/TS hiện tại; hướng dẫn đặt breakpoint.
3. **`lessons/package.json` + `lessons/tsconfig.json`:** devDependencies `typescript`, `@types/node`; tsconfig `strict: true`, `noUncheckedIndexedAccess: true`, `module/moduleResolution: nodenext`, `outDir: .build`. Riêng bài T06–T07 cần `experimentalDecorators` + `emitDecoratorMetadata` (tsconfig riêng trong thư mục bài, `extends` file chung) và `reflect-metadata`.
4. **`lessons/check.sh`:** theo đặc tả trong CLAUDE.md. Tự nhận dạng loại bài theo file trong `checks/`: `.test.js` → `node --test`; `.test.ts` → `tsc` rồi `node --test` trên `.build`; `.expected.txt` → so output; `.e2e-spec.ts` → copy vào `shop-api/test/_checks/` và chạy Jest. In kết quả dạng ✅/❌ từng test, kết luận `Kết quả: ✅ ĐÚNG / ❌ SAI`. Thử bằng một bài mẫu `lessons/_sample/` (1 hàm `sum`, 3 test).
5. **`env/docker-compose.yml`:** `postgres:18` (container `nest-practice-pg`, port `5434:5432`, volume có tên, `TZ`/`PGTZ` để UTC) và `redis:8` (container `nest-practice-redis`, port `6380:6379`). Ghi chú cấu hình trong file. Postgres có DB `shop_dev` và `shop_test`; DB `shop_xs/s/m` sinh ở B03.
6. **`bench/bench.sh`:** theo đặc tả trong CLAUDE.md, dùng `npx autocannon -j`. Thêm `bench/scenarios/hello.json` và `bench/hello-server.js` (server `http` thuần, có 1 route chặn event loop 20ms bằng vòng lặp đồng bộ). Chạy `--conns 1,10,100` cho cả 2 route để người học thấy ngay "1 dòng code đồng bộ chặn cả server".
7. Giới thiệu 5 lệnh terminal dùng suốt khóa: `cd`, `ls`, `node`, `npm run`, `curl`. Có thể chạy trong Git Bash hoặc PowerShell.
8. Pass khi `check.sh` chấm được bài mẫu và `bench` xuất được bảng so sánh ở `1,10,100` conns.

## Riêng C01 (tạo `shop-api`)
- `npx @nestjs/cli new shop-api --package-manager npm --strict` (kiểm tra cờ hiện hành bằng `--help`), xóa phần mẫu không cần.
- Thêm `test/_checks/` vào `.gitignore`. Cấu hình `test/jest-e2e.json` để chạy được file e2e trong `test/_checks/`.
- `git init` trong thư mục gốc workspace (nếu chưa có) để người học commit theo từng module.
- Domain bám dataset `shop` bên workspace SQL (`D:\Learning\Sql\datasets\shop\schema.sql`): users, categories (cây), products, orders, order_items, payments. Đọc file đó để đặt tên field nhất quán.

## Riêng T07 (Mini-framework)
Không dùng thư viện ngoài ngoài `reflect-metadata`. Bài chia nhỏ theo thứ tự: container đăng ký class → resolve không tham số → resolve theo `design:paramtypes` → singleton cache → phát hiện vòng phụ thuộc → `@Controller`/`@Get` lưu metadata → router trên `http` gọi đúng handler → param decorator `@Param`. Cuối buổi so sánh từng phần với cách Nest làm (`@Injectable`, `ModuleRef`, `RouterExplorer`).

## Riêng P05 (Scale effects)
Đây là buổi thí nghiệm, không theo dạng đề bài thông thường. `exercises.md` là danh sách **thí nghiệm**. Mỗi thí nghiệm gồm 4 phần:

```
### Thí nghiệm N: <tên>
Giả thuyết (người học viết TRƯỚC khi chạy): ...
Cách đo: scenario + bench --conns ... --data ...
Kết quả: bảng bench (+ biểu đồ ASCII nếu có ích)
Giải thích điểm gãy: ...
```

- **P05a · Tải:**
  - Tăng dần conns (1 → 10 → 100 → 500) cho 1 endpoint đọc DB: tìm điểm bão hòa RPS, p99 bắt đầu tăng tuyến tính (hàng đợi).
  - Đổi kích thước pool DB (2, 10, 50): thấy pool nhỏ tạo hàng đợi, pool lớn đẩy tải sang Postgres.
  - Thêm 1 đoạn CPU-bound 10ms vào handler: đo event loop lag và p99 của **mọi** endpoint khác.
  - Gọi dịch vụ ngoài chậm (mock 500ms) không timeout: xem connection và memory dồn lên.
  - Express vs Fastify adapter trên cùng endpoint.
- **P05b · Dữ liệu:**
  - Cùng endpoint list ở `xs → s → m`: có index và không có index.
  - Endpoint có N+1 vs đã join/batch: số query và p99 theo N.
  - Trả về 10k bản ghi một lần: thời gian `JSON.stringify` chặn loop.
  - Offset sâu vs cursor pagination.
- Cuối buổi viết `review.md` có mục **"Quy tắc ngón tay cái của tôi"**: 5–10 kết luận do người học tự rút ra từ số đo, vd. "ở máy này, 1 instance shop-api endpoint đọc đơn giản đạt ~X RPS ở p99 < 50ms". Mục này dùng làm tham chiếu cho bước ước lượng trong nest-design.
