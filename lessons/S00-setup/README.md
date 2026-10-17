# S00 · Dựng môi trường

Buổi này **không có bài tập code**: bạn gõ lệnh, coach kiểm tra. Hạ tầng (`env/`, `bench/`, `lessons/check.sh`, `lessons/_sample/`) đã có sẵn trong repo; việc của bạn là cài công cụ và chạy thử từng mảnh. Khoảng 60–90 phút.

## Mục tiêu
- Cài Node LTS qua `fnm`/`nvm-windows`, chạy được file `.js` và REPL.
- Cấu hình VS Code (ESLint, Prettier, debugger Node).
- Chấm được bài mẫu bằng `lessons/check.sh`.
- Bật Postgres + Redis bằng `docker compose`.
- Chạy `bench/bench.sh` và đọc được bảng RPS / p99.

## 1. Node.js
```bash
fnm install --lts && fnm use lts-latest     # hoặc: nvm install lts / nvm use lts
node -v && npm -v                           # khóa học dùng Node 24 LTS
node                                        # REPL: gõ 1 + 1, .exit để thoát
echo "console.log('hello', process.version)" > hello.js && node hello.js
```
Node là **runtime** chạy JavaScript ngoài trình duyệt (V8 + libuv). `PATH` là danh sách thư mục shell tìm lệnh; `node -v` báo "not found" nghĩa là PATH chưa trỏ tới Node. Ghi phiên bản thật vào bảng "Môi trường" trong `progress/tracker.md`.

## 2. VS Code
- Extension: **ESLint**, **Prettier**.
- Debug: tạo `.vscode/launch.json` với cấu hình `"type": "node", "request": "launch", "program": "${file}"`. Đặt breakpoint ở một dòng của `hello.js`, bấm F5.
- Debug server đang chạy: `node --inspect file.js` rồi "Attach to Node" (cổng 9229). Sẽ dùng thật ở C01 (`npm run start:debug`) và N07.

## 3. Runner chấm bài
```bash
cd lessons && npm ci && cd ..
bash lessons/check.sh lessons/_sample 01 --solutions   # xem một bài đúng trông thế nào
bash lessons/check.sh lessons/_sample 01               # chưa có answers/ex01.js → báo thiếu bài làm
```
Làm theo `lessons/_sample/README.md`: viết `answers/ex01.js` export `sum(a, b)` rồi chấm lại. Output có dạng `ℹ pass N / fail M` và dòng `Kết quả: ✅ ĐÚNG` hoặc `❌ SAI`. `tsconfig` của `lessons/` bật `strict`; bài `.ts` sai kiểu = SAI.

## 4. Docker: Postgres + Redis
```bash
docker compose -f env/docker-compose.yml up -d postgres redis
docker compose -f env/docker-compose.yml ps        # postgres "healthy"
docker exec nest-practice-pg psql -U postgres -c "select now(), current_setting('TimeZone')"   # UTC
```
Cổng host: Postgres **5434** (5433 dành cho workspace SQL), Redis **6380**. Git Bash trên Windows: thêm `MSYS_NO_PATHCONV=1` nếu `docker exec` có tham số đường dẫn. Chưa cần dùng DB đến B01; để sẵn cho khỏi bất ngờ.

## 5. `bench`: thấy "một dòng đồng bộ chặn cả server"
```bash
node bench/hello-server.js &                       # cổng 3000
bash bench/bench.sh hello-fast  --conns 1,10,100 --duration 5
bash bench/bench.sh hello-block --conns 1,10,100 --duration 5
curl localhost:3000/_debug/loop                    # p99 event loop delay (ms)
```
Bảng kết quả có cột `data | conns | RPS | p50 | p99 | lỗi/timeout | event loop lag p99`. `/block` chặn loop 20 ms bằng vòng lặp đồng bộ:

| Dự đoán trước khi chạy | Thực tế |
|---|---|
| RPS tối đa của `/block` ≈ 1000 / 20 = **50**, bất kể conns | điền sau khi đo |
| p99 ở 100 conns ≈ 100 × 20 ms = **2 s** (xếp hàng sau nhau) | điền sau khi đo |

Kết quả lưu ở `bench/results/` (đã ghi cả máy đo). Cột lag chỉ có số khi server có `/_debug/loop`; `shop-api` bật nó ở P05.

## 6. Năm lệnh terminal dùng suốt khóa
| Lệnh | Việc |
|---|---|
| `cd`, `ls` | di chuyển, liệt kê |
| `node file.js` | chạy file |
| `npm run <script>` | chạy script trong `package.json` |
| `curl -i localhost:3000/x` | gọi HTTP, `-i` xem header, `-X POST -H 'content-type: application/json' -d '{"a":1}'` gửi body |

## Bẫy hay gặp
| Bẫy | Cách đúng |
|---|---|
| Đang dùng Node cũ vì shell chưa nạp `fnm env` | `node -v` phải ≥ 24 trước khi `npm ci` |
| Cổng 5434/6380 bị chiếm | `docker ps`; đổi cổng trong `env/docker-compose.yml` và ghi lại |
| `bench` ra lỗi hàng loạt vì quên bật server | chạy server trước, kiểm tra bằng `curl` |
| Đo khi máy đang bận (build, video) | đóng bớt, chạy `--runs 3` lấy median |

## Pass
`check.sh` chấm được bài mẫu **và** `bench` xuất được bảng ở `1,10,100` conns cho cả `hello-fast` lẫn `hello-block`, kèm dự đoán vs thực tế như trên.
