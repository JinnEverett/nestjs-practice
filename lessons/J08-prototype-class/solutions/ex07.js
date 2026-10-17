// ex07 · BaseRepository / CachedRepository — đáp án best practice
//
// Bug gốc: findById viết bằng arrow class field → nó là own property của instance, KHÔNG nằm trên
// BaseRepository.prototype → `super.findById` là undefined. Tệ hơn: field đó được gán lên INSTANCE trong
// constructor của lớp cha, nên nó che luôn method findById mà lớp con định nghĩa trên prototype.
//
// - Method thường (nằm trên prototype) → override được và gọi được qua super.
// - Lưu bản copy, trả bản copy → state nội bộ không bị bên ngoài sửa.
// - Cache bằng Map + has() → nhớ cả kết quả null (tránh "cache miss" vĩnh viễn với id không tồn tại —
//   cache penetration, B07).
export class BaseRepository {
  #items;

  constructor(items) {
    this.#items = [...items];
  }

  findAll() {
    return [...this.#items];
  }

  findById(id) {
    return this.#items.find((item) => item.id === id) ?? null;
  }
}

export class CachedRepository extends BaseRepository {
  #cache = new Map();

  findById(id) {
    if (!this.#cache.has(id)) this.#cache.set(id, super.findById(id));
    return this.#cache.get(id);
  }

  invalidate(id) {
    this.#cache.delete(id);
  }
}
