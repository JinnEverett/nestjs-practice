// J10 · ex04 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex04.txt
// Mỗi kịch bản chạy cách nhau 20ms nên không xen kẽ nhau.
const log = (label) => (v) => {
  console.log(label, v);
  return v;
};
const at = (ms, fn) => setTimeout(fn, ms);

at(0, () =>
  Promise.resolve(1)
    .then((v) => v + 1)
    .then(log('A'))
    .then((v) => {
      throw new Error('x' + v);
    })
    .then(log('B-không-in'))
    .catch((e) => e.message)
    .then(log('C'))
    .finally(() => 'bị bỏ qua')
    .then(log('D')),
);
at(20, () =>
  Promise.reject(new Error('r'))
    .then(log('E-không-in'), (e) => 'handled ' + e.message)
    .then(log('F')),
);
at(40, () => Promise.resolve(Promise.resolve('lồng')).then(log('G')));
at(60, () =>
  Promise.resolve({
    then(res) {
      res('thenable');
    },
  }).then(log('H')),
);
at(80, () => {
  const p = new Promise((res) => {
    res('lần 1');
    res('lần 2');
  });
  p.then(log('I'));
});
at(100, () =>
  Promise.resolve('x')
    .then(() => {
      Promise.resolve('không được return');
    })
    .then(log('J')),
);
at(120, () => Promise.all([]).then((v) => console.log('K', v.length)));
at(140, () =>
  Promise.resolve(5)
    .then((v) => {
      throw v;
    })
    .catch(log('L')),
);
