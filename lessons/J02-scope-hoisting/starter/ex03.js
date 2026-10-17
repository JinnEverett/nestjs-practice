// J02 · ex03 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex03.txt
// File này là ES module → strict mode.
const show = (label, fn) => {
  try {
    console.log(label, fn());
  } catch (e) {
    console.log(label, e.name);
  }
};

const arr = [1];
arr.push(2);
show('A', () => arr.length);
show('B', () => {
  const o = { n: 1 };
  o.n = 2;
  return o.n;
});
show('C', () => {
  const n = 1;
  n = 2;
  return n;
});
show('D', () => {
  undeclaredVariable = 5;
  return undeclaredVariable;
});
show('E', () => {
  let v = 1;
  {
    let v = 2;
    v++;
  }
  return v;
});
show('F', () => {
  var v = 1;
  {
    var v = 2;
  }
  return v;
});
show('G', () => {
  let v = 1;
  function inner() {
    return v;
  }
  v = 3;
  return inner();
});
show('H', () => typeof neverDeclared);
show('I', () => {
  if (true) {
    return z;
    let z = 1;
  }
});
show('J', () =>
  (function () {
    return typeof this;
  })(),
);
