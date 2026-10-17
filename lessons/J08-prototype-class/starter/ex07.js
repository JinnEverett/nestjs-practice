// J08 · ex07 — code có bug. Viết lại đúng vào answers/ex07.js
export class BaseRepository {
  constructor(items) {
    this.items = items;
  }
  findAll = () => this.items;
  findById = (id) => this.items.find((x) => x.id === id) ?? null;
}

export class CachedRepository extends BaseRepository {
  cache = new Map();
  findById(id) {
    if (!this.cache.has(id)) this.cache.set(id, super.findById(id)); // TypeError: super.findById is not a function
    return this.cache.get(id);
  }
}
