#!/usr/bin/env bash
# bench.sh <scenario> [--conns 1,10,100] [--data s,m] [--duration 10] [--runs 1] [--name x] [--base url] [--no-save]
# scenario: tên file trong bench/scenarios/ (không cần .json) hoặc đường dẫn tới file .json
#   { "method": "GET", "path": "/products/{{int:1:10000}}", "headers": {}, "body": null }
# Kết quả lưu ở bench/results/<YYYY-MM-DD>-<name>.md
here=$(cd "$(dirname "$0")" && pwd)
[ -d "$here/node_modules" ] || (cd "$here" && npm install --no-audit --no-fund >/dev/null)
exec node "$here/bench.mjs" "$@"
