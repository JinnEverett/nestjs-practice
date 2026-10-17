// J04 · ex07 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex07.txt
const show = (label, fn) => {
  try {
    console.log(label, fn());
  } catch (e) {
    console.log(label, e.name);
  }
};

class Timer {
  constructor() {
    this.label = 'timer';
  }
  regular() {
    return [1].map(function () {
      return this?.label;
    })[0];
  }
  arrow() {
    return [1].map(() => this.label)[0];
  }
  nested() {
    const self = this;
    function inner() {
      return self.label;
    }
    return inner();
  }
  get upper() {
    return this.label.toUpperCase();
  }
  static create() {
    return this.name;
  }
}

const t = new Timer();
console.log('A', t.regular());
console.log('B', t.arrow());
console.log('C', t.nested());
console.log('D', t.upper);
console.log('E', Timer.create());
const { arrow } = t;
show('F', () => arrow());
const obj = { label: 'obj', run: t.arrow };
console.log('G', obj.run());
const o2 = {
  label: 'o2',
  getter() {
    return () => this.label;
  },
};
const fn = o2.getter();
console.log('H', fn.call({ label: 'other' }));
