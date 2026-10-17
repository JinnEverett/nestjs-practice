// J12 · ex01 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex01.txt
import './ex01-lib/log.js';
import { count, increment } from './ex01-lib/counter.js';
import * as counterNs from './ex01-lib/counter.js';

console.log('main bắt đầu');
console.log('A', count);
increment();
console.log('B', count, counterNs.count);
const again = await import('./ex01-lib/counter.js');
console.log('C', again === counterNs, again.count);
try {
  count = 5;
} catch (e) {
  console.log('D', e.name);
}
console.log('E', typeof require, typeof import.meta.url);
