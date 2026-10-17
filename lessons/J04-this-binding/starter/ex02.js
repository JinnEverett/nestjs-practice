// J04 · ex02 — code có bug. Viết lại đúng vào answers/ex02.js
export class Counter {
  constructor() {
    this.total = 0;
  }
  add(n) {
    this.total += n;
    return this;
  }
  addAll(nums) {
    nums.forEach(this.add); // TypeError
    return this;
  }
}
