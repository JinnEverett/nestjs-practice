// ex02 · Counter — đáp án best practice
//
// - `add` là arrow function class field: được tạo trong constructor, `this` cố định là instance
//   → truyền thẳng làm callback hay destructure đều chạy đúng.
// - `addAll` dùng `for...of` gọi qua `this.add` — rõ ràng, không phụ thuộc vào thisArg.
// - Trả về `this` cho phép gọi nối (fluent API).
//
// Đánh đổi của arrow field: mỗi instance có một bản hàm riêng (tốn bộ nhớ hơn method trên prototype,
// và lớp con không gọi được super.add()). Với vài instance thì không đáng kể.
// Cách khác: giữ method thường và trong constructor viết `this.add = this.add.bind(this);`.
export class Counter {
  total = 0;

  add = (n) => {
    this.total += n;
    return this;
  };

  addAll(nums) {
    for (const n of nums) this.add(n);
    return this;
  }
}
