// ex06 · Mixins — đáp án best practice
//
// - Mỗi mixin là hàm (Base) => class extends Base: thêm đúng MỘT năng lực, kết hợp tự do.
// - Dùng class field (createdAt, deletedAt) → được khởi tạo sau super(...args) của Base,
//   nên constructor của Base vẫn nhận đủ tham số mà mixin không cần biết chữ ký của nó.
// - Một `now` dùng chung cho createdAt/updatedAt để hai giá trị bằng nhau tuyệt đối.
// - Getter isDeleted là giá trị dẫn xuất, không lưu trùng.
export const withTimestamps = (Base) =>
  class extends Base {
    createdAt;
    updatedAt;

    constructor(...args) {
      super(...args);
      const now = new Date();
      this.createdAt = now;
      this.updatedAt = now;
    }

    touch() {
      this.updatedAt = new Date();
    }
  };

export const withSoftDelete = (Base) =>
  class extends Base {
    deletedAt = null;

    get isDeleted() {
      return this.deletedAt !== null;
    }

    softDelete() {
      this.deletedAt = new Date();
    }

    restore() {
      this.deletedAt = null;
    }
  };
