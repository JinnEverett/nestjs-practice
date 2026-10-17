// ex06 · fromEvent — đáp án best practice
//
// - Một hàm `cleanup` duy nhất gỡ CẢ HAI listener và xóa timer; mọi nhánh (event, error, timeout) gọi nó
//   trước khi settle → không rò listener (Node cảnh báo MaxListenersExceededWarning khi rò).
// - Dùng `on` + tự gỡ thay vì `once` cho từng event: `once('ready')` vẫn để lại listener 'error' và ngược lại.
// - Timer chỉ tạo khi có timeoutMs.
// Thực tế: `events.once(emitter, name, { signal })` của Node làm việc này (trả mảng args, tự reject khi 'error').
export function fromEvent(emitter, event, { timeoutMs } = {}) {
  return new Promise((resolve, reject) => {
    let timer;
    const cleanup = () => {
      emitter.off(event, onEvent);
      emitter.off('error', onError);
      clearTimeout(timer);
    };
    const onEvent = (payload) => {
      cleanup();
      resolve(payload);
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };

    emitter.on(event, onEvent);
    emitter.on('error', onError);
    if (timeoutMs !== undefined) {
      timer = setTimeout(() => {
        cleanup();
        const error = new Error(`Timeout waiting for "${event}"`);
        error.name = 'TimeoutError';
        reject(error);
      }, timeoutMs);
    }
  });
}
