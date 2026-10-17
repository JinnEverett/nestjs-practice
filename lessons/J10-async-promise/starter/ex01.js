// J10 · ex01 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex01.txt
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
queueMicrotask(() => console.log('D'));
setTimeout(() => {
  console.log('E');
  Promise.resolve().then(() => console.log('F'));
}, 0);
new Promise((resolve) => {
  console.log('G');
  resolve();
}).then(() => console.log('H'));
Promise.resolve().then(() => {
  console.log('I');
  setTimeout(() => console.log('J'), 0);
});
console.log('K');
