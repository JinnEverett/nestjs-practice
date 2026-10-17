// ex06 · config — đáp án best practice
//
// - Top-level await: module chưa chạy xong thì mọi module import nó phải đợi → nơi dùng nhận config
//   đã sẵn sàng, không phải xử lý Promise.
// - Đường dẫn theo import.meta.url (vị trí FILE NÀY), không theo process.cwd() (thư mục chạy lệnh).
// - deepFreeze đệ quy → không ai sửa nhầm config lúc chạy.
// - get(path) dùng reduce + ?. → thiếu tầng nào cũng ra fallback.
// Cách khác (Node 22+): import raw from '../fixtures/config.json' with { type: 'json' };
// Trong NestJS: ConfigModule.forRoot + ConfigService.get('db.port') (C09).
import { readFile } from 'node:fs/promises';

const deepFreeze = (value) => {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const config = deepFreeze(JSON.parse(await readFile(new URL('../fixtures/config.json', import.meta.url), 'utf8')));

export function get(path, fallback) {
  return path.split('.').reduce((node, key) => node?.[key], config) ?? fallback;
}
