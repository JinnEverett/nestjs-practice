// ex03 · Shape / Rectangle / Circle — đáp án best practice
//
// - `new.target === Shape` chặn khởi tạo lớp trừu tượng trực tiếp (JS không có từ khóa abstract;
//   TypeScript có — T04).
// - area() mặc định ném lỗi rõ ràng → lớp con quên override sẽ lộ ra ngay khi chạy.
// - describe() viết MỘT lần ở lớp cha, dùng `this.constructor.name` và `this.area()` (đa hình):
//   lớp con chỉ cần cung cấp area().
// - largest dùng reduce, mảng rỗng → null (giá trị khởi tạo null).
export class Shape {
  constructor() {
    if (new.target === Shape) throw new TypeError('Shape is abstract');
  }

  area() {
    throw new Error('Not implemented');
  }

  describe() {
    return `${this.constructor.name} có diện tích ${this.area().toFixed(2)}`;
  }

  static largest(shapes) {
    return shapes.reduce((best, s) => (best === null || s.area() > best.area() ? s : best), null);
  }
}

export class Rectangle extends Shape {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }

  area() {
    return this.width * this.height;
  }
}

export class Circle extends Shape {
  constructor(radius) {
    super();
    this.radius = radius;
  }

  area() {
    return Math.PI * this.radius ** 2;
  }
}
