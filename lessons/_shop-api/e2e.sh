#!/usr/bin/env bash
# Chấm bài Tier C trở đi bằng e2e (Jest + supertest) — được check.sh gọi tự động.
#   e2e.sh <thư-mục-bài> <NN|all> <answers|solutions>
#   answers   : chạy trên shop-api/ của người học (D:/Learning/Nestjs/shop-api)
#   solutions : dựng shop-api tham chiếu (.shop-ref/) bằng overlay rồi chạy
# Các bước: (1) tsc --noEmit (lỗi kiểu = SAI)  (2) copy checks + testkit vào test/_checks/  (3) jest  (4) dọn.
set -u
here=$(cd "$(dirname "$0")/.." && pwd)
dir=$1; nn=$2; src=$3
name=$(basename "$dir"); id=${name%%-*}

if [ "$src" = solutions ]; then
  node "$here/_shop-api/assemble.mjs" "$id" || { echo "Kết quả  : ❌ SAI (không dựng được shop-api tham chiếu)"; exit 2; }
  app=$here/.shop-ref
else
  app=$(cd "$here/.." && pwd)/shop-api
  [ -f "$app/package.json" ] || { echo "Chưa có shop-api/ ở $app — tạo ở bài C01 (nest new shop-api, chọn CJS)."; exit 2; }
  [ -f "$app/test/jest-e2e.json" ] || { echo "Thiếu $app/test/jest-e2e.json (Nest CLI sinh sẵn ở bản CJS + Jest)."; exit 2; }
fi

# Bài cần database: bật container nếu chưa chạy
if [ -f "$dir/checks/.needs-db" ]; then
  status=$(docker inspect -f '{{.State.Health.Status}}' nest-practice-pg 2>/dev/null || echo none)
  if [ "$status" != healthy ]; then
    echo "== khởi động Postgres (nest-practice-pg)"
    (cd "$here/.." && docker compose -f env/docker-compose.yml up -d --wait postgres) || { echo "Không bật được Postgres"; exit 2; }
  fi
fi
if [ -f "$dir/checks/.needs-redis" ]; then
  (cd "$here/.." && docker compose -f env/docker-compose.yml up -d redis) >/dev/null 2>&1
fi

dst=$app/test/_checks
rm -rf "$dst"; mkdir -p "$dst"
cp "$here"/_shop-api/testkit/*.ts "$dst/"
[ -d "$dir/starter" ] && [ -d "$dir/starter/_checks" ] && cp -r "$dir/starter/_checks/." "$dst/"
if [ "$nn" = all ]; then
  cp "$dir"/checks/ex*.e2e-spec.ts "$dst/" 2>/dev/null
  pattern="test/_checks/ex"
else
  [ -f "$dir/checks/ex$nn.e2e-spec.ts" ] || { echo "Không tìm thấy checks/ex$nn.e2e-spec.ts"; rm -rf "$dst"; exit 2; }
  cp "$dir/checks/ex$nn.e2e-spec.ts" "$dst/"
  pattern="test/_checks/ex$nn"
fi
# bài đoán (🔮): lời đoán của người học (hoặc đáp án mẫu khi --solutions) → test/_checks/answers/
mkdir -p "$dst/answers"
if [ "$src" = solutions ]; then
  [ -d "$dir/solutions/_answers" ] && cp -r "$dir/solutions/_answers/." "$dst/answers/"
else
  [ -d "$dir/answers" ] && cp -r "$dir/answers/." "$dst/answers/"
fi
# file phụ trợ của riêng bài (fixture dùng chung cho nhiều check)
for f in "$dir"/checks/_*.ts; do [ -f "$f" ] && cp "$f" "$dst/"; done

cleanup() { rm -rf "$dst"; }
trap cleanup EXIT

cd "$app" || exit 2
echo "== tsc --noEmit (strict)"
if ! node_modules/.bin/tsc --noEmit -p tsconfig.json --pretty false; then
  echo "Kết quả  : ❌ SAI (lỗi kiểu / lỗi biên dịch ở trên)"; exit 1
fi
echo "== jest e2e ($src)"
if node --experimental-vm-modules node_modules/jest/bin/jest.js --config test/jest-e2e.json --runInBand --forceExit "$pattern"; then
  echo "Kết quả  : ✅ ĐÚNG"
else
  echo "Kết quả  : ❌ SAI"; exit 1
fi
