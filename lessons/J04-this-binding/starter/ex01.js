// J04 · ex01 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex01.txt (ES module → strict mode)
const show = (label, fn) => {
  try {
    console.log(label, fn());
  } catch (e) {
    console.log(label, e.name);
  }
};

const user = {
  name: 'An',
  hi() {
    return this.name;
  },
  arrowHi: () => typeof this,
};

show('A', () => user.hi());
const hi = user.hi;
show('B', () => hi());
show('C', () => hi.call({ name: 'Bình' }));
show('D', () => hi.apply({ name: 'Chi' }, []));
const bound = hi.bind({ name: 'Dũng' });
show('E', () => bound());
show('F', () => bound.call({ name: 'Em' }));
show('G', () => bound.bind({ name: 'Giang' })());
show('H', () => user.arrowHi());

function Person(name) {
  this.name = name;
}
show('I', () => new Person('Hà').name);
show('J', () => [user].map(user.hi)[0]);
show('K', () => [user].map(user.hi, { name: 'Khoa' })[0]);
