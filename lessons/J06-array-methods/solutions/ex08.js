// ex08 · flattenCategories — đáp án best practice
//
// - Đệ quy với flatMap: mỗi nút trả về [chính nó, ...con cháu đã làm phẳng] → tiền thứ tự tự nhiên.
// - depth và path cha được truyền xuống qua tham số (không có state dùng chung).
// - `children ?? []` cho nút lá thiếu children.
// - Độ sâu 500 an toàn với đệ quy; cây sâu hàng chục nghìn tầng thì đổi sang stack tường minh.
// Bên DB: đây là recursive CTE (SQL I02) — thường nên để DB làm khi cây lớn.
export function flattenCategories(tree, depth = 0, parentPath = '') {
  return tree.flatMap(({ id, name, children = [] }) => {
    const path = parentPath ? `${parentPath} > ${name}` : name;
    return [{ id, name, depth, path }, ...flattenCategories(children, depth + 1, path)];
  });
}
