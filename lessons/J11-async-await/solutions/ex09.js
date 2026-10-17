// ex09 · createInflightTracker — đáp án best practice
//
// - Set các promise đang chạy; mỗi promise tự xóa mình khi settle (`finally`), kèm `.catch(() => {})` trên
//   NHÁNH theo dõi để tracker không tạo unhandled rejection (caller vẫn nhận lỗi trên promise gốc).
// - drain lặp: đợi allSettled của snapshot hiện tại; nếu trong lúc đợi có promise mới thì đợi tiếp,
//   tới khi Set rỗng.
// - Timeout bằng race với một promise reject TimeoutError; clearTimeout khi xong.
// Dùng trong graceful shutdown (P02): nhận SIGTERM → ngừng nhận request mới → drain(10_000) → đóng DB pool.
export function createInflightTracker() {
  const inflight = new Set();

  const waitAll = async () => {
    while (inflight.size > 0) await Promise.allSettled([...inflight]);
  };

  return {
    track(promise) {
      inflight.add(promise);
      promise
        .finally(() => inflight.delete(promise))
        .catch(() => {});
      return promise;
    },
    get size() {
      return inflight.size;
    },
    async drain(timeoutMs) {
      let timer;
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error(`Drain timed out after ${timeoutMs}ms`), { name: 'TimeoutError' })), timeoutMs);
      });
      try {
        await Promise.race([waitAll(), timeout]);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
