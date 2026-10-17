// ex05 · updateIn — đáp án best practice
//
// - Đệ quy theo path: mỗi tầng chỉ copy NÚT nằm trên đường đi; nhánh khác giữ nguyên tham chiếu.
// - Mảng copy bằng `[...arr]` rồi gán index → vẫn là mảng (spread `{...arr}` sẽ biến thành object).
// - Nếu tầng con không đổi (trả về đúng tham chiếu cũ) thì trả về chính node hiện tại →
//   updater "không làm gì" sẽ trả lại obj gốc; React/Redux dựa vào điều này để bỏ qua render.
export function updateIn(obj, path, updater) {
  if (path.length === 0) return updater(obj);

  const [key, ...rest] = path;
  const node = obj ?? {};
  const child = node[key];
  const nextChild = updateIn(child, rest, updater);
  if (Object.is(nextChild, child) && obj !== undefined) return obj;

  if (Array.isArray(node)) {
    const copy = [...node];
    copy[key] = nextChild;
    return copy;
  }
  return { ...node, [key]: nextChild };
}
