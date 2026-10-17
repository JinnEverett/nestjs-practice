// ex05 · invokeMethod — đáp án best practice
//
// - Tách đường dẫn: phần cuối là tên method, phần trước là đường tới object chứa nó ("owner").
// - `reduce` + `?.` đi qua từng tầng an toàn; tầng thiếu/null → undefined thay vì TypeError khó hiểu.
// - Gọi bằng `method.apply(owner, args)` → this đúng là object đứng trước method,
//   giống hệt khi viết root.services.mailer.send(...).
// - Mọi lỗi đều là TypeError có `path` → dễ debug cấu hình plugin.
export function invokeMethod(root, path, ...args) {
  const parts = path.split('.');
  const methodName = parts.pop();
  const owner = parts.reduce((obj, key) => obj?.[key], root);
  const method = owner?.[methodName];
  if (typeof method !== 'function') {
    throw new TypeError(`invokeMethod: "${path}" is not a callable method`);
  }
  return method.apply(owner, args);
}
