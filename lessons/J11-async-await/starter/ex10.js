// J11 · ex10 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex10.txt
const sleep = (ms, v, fail) => new Promise((res, rej) => setTimeout(() => (fail ? rej(new Error(v)) : res(v)), ms));
const show = async (label, p) => {
  try {
    console.log(label, JSON.stringify(await p));
  } catch (e) {
    console.log(label, e.constructor.name, e.message);
  }
};

await show('A', Promise.all([sleep(20, 'a'), sleep(10, 'b')]));
await show('B', Promise.all([sleep(20, 'a'), sleep(10, 'lỗi-b', true)]));
await show('C', Promise.allSettled([sleep(5, 'ok'), sleep(5, 'hỏng', true)]).then((rs) => rs.map((r) => r.status)));
await show('D', Promise.race([sleep(20, 'chậm'), sleep(10, 'nhanh')]));
await show('E', Promise.race([sleep(20, 'chậm'), sleep(10, 'lỗi-nhanh', true)]));
await show('F', Promise.any([sleep(5, 'x', true), sleep(15, 'y')]));
await show('G', Promise.any([sleep(5, 'x', true), sleep(10, 'z', true)]));

const t0 = Date.now();
await sleep(30);
await sleep(30);
console.log('H', Date.now() - t0 >= 55);

const t1 = Date.now();
await Promise.all([sleep(30), sleep(30)]);
console.log('I', Date.now() - t1 < 55);
