// J10 · ex10 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex10.txt
setTimeout(() => {
  console.log('A timeout');
  setTimeout(() => console.log('B timeout lồng'), 0);
  setImmediate(() => console.log('C immediate'));
  process.nextTick(() => console.log('D nextTick'));
  Promise.resolve().then(() => console.log('E promise'));
}, 0);

setTimeout(() => {
  Promise.resolve().then(() => console.log('F promise'));
  process.nextTick(() => console.log('G nextTick'));
  queueMicrotask(() => process.nextTick(() => console.log('H nextTick từ microtask')));
  Promise.resolve().then(() => console.log('I promise 2'));
}, 50);
