// J13 · ex10 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex10.txt
function* gen() {
  try {
    const a = yield 1;
    console.log('A nhận', a);
    yield a * 2;
    return 'xong';
  } finally {
    console.log('B finally');
  }
}

const g = gen();
console.log('C', JSON.stringify(g.next('bỏ qua')));
console.log('D', JSON.stringify(g.next(5)));
console.log('E', JSON.stringify(g.next()));
console.log('F', JSON.stringify(g.next()));

for (const v of gen()) {
  console.log('G', v);
  break;
}

console.log('H', [...gen()].join(','));

function* inner() {
  yield 'x';
  return 'r';
}
function* outer() {
  const r = yield* inner();
  yield r;
}
console.log('I', [...outer()].join(','));

const lazy = (function* () {
  let i = 0;
  while (true) yield i++;
})();
console.log('J', lazy.next().value, lazy.next().value, lazy.return(99).value, lazy.next().done);
