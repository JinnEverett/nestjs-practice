// J11 · ex01 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex01.txt
async function a() {
  console.log('A1');
  await null;
  console.log('A2');
  return 'A-ret';
}
async function b() {
  console.log('B1');
  throw new Error('b-lỗi');
}

console.log('S1');
const pa = a();
console.log('S2', pa instanceof Promise);
b().catch((e) => console.log('B-catch', e.message));
pa.then((v) => console.log('A-then', v));
console.log('S3');

(async () => {
  const x = await 42;
  console.log('X', x);
  try {
    await Promise.reject(new Error('r'));
  } catch (e) {
    console.log('Y', e.message);
  }
  const v = await new Promise((r) => setTimeout(() => r('timer'), 0));
  console.log('Z', v);
})();
