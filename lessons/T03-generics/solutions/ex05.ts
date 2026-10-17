// ex05 · createEmitter — đáp án best practice
//
// - Events là "bản đồ" tên event → kiểu payload; `K extends keyof Events` + `Events[K]` nối tên với payload.
// - Bên trong, các handler của mọi event nằm chung một Map nên kiểu lưu trữ phải "rộng": Handler<never>
//   (hàm nhận never chấp nhận mọi handler). Khi emit, ép lại về Handler<Events[K]> — đúng vì handler của key K
//   chỉ được thêm qua on<K>. Một ép kiểu nội bộ, API public an toàn hoàn toàn.
type Handler<P> = (payload: P) => void;

export function createEmitter<Events extends Record<string, unknown>>() {
  const handlers = new Map<keyof Events, Set<Handler<never>>>();

  return {
    on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
      const set = handlers.get(event) ?? new Set();
      set.add(handler);
      handlers.set(event, set);
      return () => set.delete(handler);
    },
    emit<K extends keyof Events>(event: K, payload: Events[K]): void {
      // Mọi handler trong set của K đều được đăng ký với kiểu Handler<Events[K]>.
      for (const handler of [...(handlers.get(event) ?? [])] as Handler<Events[K]>[]) handler(payload);
    },
  };
}
