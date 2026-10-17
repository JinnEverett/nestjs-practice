// ex04 · InMemoryRepository — đáp án best practice
//
// - Ràng buộc `T extends { id: number }` → được đọc/ghi .id an toàn.
// - Kiểu tham số suy ra từ T: Omit<T, 'id'> cho create, Partial<Omit<T, 'id'>> cho update → đổi entity là
//   API repo tự đổi theo.
// - Lưu và trả BẢN COPY (structuredClone/spread) → không ai sửa được state nội bộ qua tham chiếu.
// - `{ ...data, id } as T`: TS không chứng minh được Omit<T,'id'> & {id} === T với T generic — một ép kiểu
//   có lý do, đặt ở đúng một chỗ.
// Đây là hình dạng của Repository trong B06 và giao diện mà TypeORM Repository<T> cung cấp.
export class InMemoryRepository<T extends { id: number }> {
  #rows = new Map<number, T>();
  #nextId = 1;

  create(data: Omit<T, 'id'>): T {
    const row = { ...data, id: this.#nextId++ } as T;
    this.#rows.set(row.id, row);
    return { ...row };
  }

  findById(id: number): T | undefined {
    const row = this.#rows.get(id);
    return row && { ...row };
  }

  findAll(where: Partial<T> = {}): T[] {
    const conditions = Object.entries(where) as [keyof T, unknown][];
    return [...this.#rows.values()].filter((row) => conditions.every(([key, value]) => row[key] === value)).map((row) => ({ ...row }));
  }

  update(id: number, patch: Partial<Omit<T, 'id'>>): T {
    const row = this.#rows.get(id);
    if (!row) throw new Error(`Row ${id} not found`);
    const updated = { ...row, ...patch, id };
    this.#rows.set(id, updated);
    return { ...updated };
  }

  delete(id: number): boolean {
    return this.#rows.delete(id);
  }
}
