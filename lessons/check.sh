#!/usr/bin/env bash
# Chấm bài Tier J/T/N bằng test có sẵn trong checks/.
#
# Dùng:
#   bash lessons/check.sh <thư-mục-bài> <NN>              chấm answers/exNN
#   bash lessons/check.sh <thư-mục-bài> all               chấm mọi bài đã có test
#   bash lessons/check.sh <thư-mục-bài> <NN|all> --solutions   chạy test trên solutions/ (để xem đáp án chạy thế nào)
# Ví dụ:
#   bash lessons/check.sh lessons/J03-functions-closure 04
#
# Cách hoạt động: copy checks/ + answers/ (hoặc solutions/ → answers/) + fixtures/ vào lessons/.run/<bài>/,
# nếu là TypeScript thì tsc (strict) trước, rồi chạy node --test. Lỗi kiểu = SAI.
set -u
here=$(cd "$(dirname "$0")" && pwd)
dir=$(cd "${1:?thiếu thư mục bài}" && pwd); nn=${2:?thiếu số bài (vd. 03 hoặc all)}
src=answers; [ "${3:-}" = "--solutions" ] && src=solutions
name=$(basename "$dir")
[ -d "$dir/checks" ] || { echo "Không có $dir/checks"; exit 2; }

# Bài Tier C trở đi: chấm e2e trên shop-api (xem _shop-api/e2e.sh)
if ls "$dir"/checks/ex*.e2e-spec.ts >/dev/null 2>&1; then
  exec bash "$here/_shop-api/e2e.sh" "$dir" "$nn" "$src"
fi

run=$here/.run/$name-$src
rm -rf "$run"; mkdir -p "$run/answers"
cp -r "$dir/checks" "$run/checks"
[ -d "$dir/$src" ] && cp -r "$dir/$src/." "$run/answers/"
[ -d "$dir/fixtures" ] && cp -r "$dir/fixtures" "$run/fixtures"
[ -d "$dir/starter" ] && cp -r "$dir/starter" "$run/starter"
cp -r "$here/_lib" "$run/_lib"

if [ "$nn" = "all" ]; then
  mapfile -t tests < <(cd "$run/checks" && ls ex*.test.* 2>/dev/null | sort)
else
  mapfile -t tests < <(cd "$run/checks" && ls "ex$nn".test.* 2>/dev/null)
  # Bài dùng chung một thư mục đáp án (vd. T07 answers/mini-nest/) đánh dấu bằng checks/.shared-answers
  [ -f "$dir/checks/.shared-answers" ] || [ -f "$run/answers/ex$nn.js" ] || [ -f "$run/answers/ex$nn.ts" ] || [ -f "$run/answers/ex$nn.txt" ] || [ -f "$run/answers/ex$nn.cjs" ] || [ -d "$run/answers/ex$nn" ] || {
    echo "Chưa có bài làm: $dir/$src/ex$nn.(js|ts|txt|cjs)"; exit 2; }
fi
[ ${#tests[@]} -gt 0 ] || { echo "Không tìm thấy test cho ex$nn"; exit 2; }

files=()
if [[ "${tests[0]}" == *.ts ]]; then
  base=$here/tsconfig.base.json; [ -f "$dir/tsconfig.json" ] && base=$dir/tsconfig.json
  inc=$(printf '"checks/%s",' "${tests[@]}"); inc=${inc%,}
  cat > "$run/tsconfig.json" <<JSON
{ "extends": "$(cygpath -m "$base" 2>/dev/null || echo "$base")",
  "compilerOptions": { "rootDir": ".", "outDir": ".build", "noEmitOnError": true },
  "include": [$inc] }
JSON
  echo "== tsc (strict)"
  if ! (cd "$run" && "$here/node_modules/.bin/tsc" -p tsconfig.json --pretty false); then
    echo "Kết quả  : ❌ SAI (lỗi kiểu / lỗi biên dịch ở trên)"; exit 1
  fi
  for t in "${tests[@]}"; do files+=("$run/.build/checks/${t%.ts}.js"); done
else
  for t in "${tests[@]}"; do files+=("$run/checks/$t"); done
fi

echo "== node --test ($src)"
if node --test --test-concurrency=1 --test-reporter=spec "${files[@]}"; then
  echo "Kết quả  : ✅ ĐÚNG"
else
  echo "Kết quả  : ❌ SAI"; exit 1
fi
