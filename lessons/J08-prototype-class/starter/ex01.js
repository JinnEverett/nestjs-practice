// J08 · ex01 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex01.txt
const show = (label, fn) => {
  try {
    console.log(label, fn());
  } catch (e) {
    console.log(label, e.name);
  }
};

class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return `${this.name} kêu`;
  }
  static create(n) {
    return new this(n);
  }
}
class Dog extends Animal {
  speak() {
    return super.speak() + ' gâu';
  }
}
const d = new Dog('Mực');
console.log('A', d.speak());
console.log('B', Object.hasOwn(d, 'name'), Object.hasOwn(d, 'speak'), 'speak' in d);
console.log('C', Object.getPrototypeOf(d) === Dog.prototype, Object.getPrototypeOf(Dog.prototype) === Animal.prototype);
console.log('D', d instanceof Animal, d instanceof Object);
console.log('E', Dog.create('Vàng') instanceof Dog);
console.log('F', typeof Dog, typeof Dog.prototype.speak);

const o = Object.create(null);
console.log('G', typeof o.toString);

const base = {
  greet() {
    return 'hi ' + this.n;
  },
};
const child = Object.create(base);
child.n = 'An';
console.log('H', child.greet(), Object.keys(child).join(','));

class Secret {
  #code = 42;
  static peek(s) {
    return #code in s ? s.#code : 'no';
  }
}
console.log('I', Secret.peek(new Secret()), Secret.peek({}));
show('J', () => Animal('x'));
Dog.prototype.fetch = function () {
  return this.name + ' nhặt bóng';
};
console.log('K', d.fetch());
