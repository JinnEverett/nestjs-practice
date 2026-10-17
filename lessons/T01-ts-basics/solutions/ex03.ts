// ex03 · minMax — đáp án best practice
//
// - `readonly number[]` ở tham số: hứa với caller là không mutate; TS chặn sort/push trên nó.
// - Tuple có nhãn `[min: number, max: number]` tự mô tả ý nghĩa từng vị trí.
// - Kiểm tra rỗng trước → Math.min/max không trả Infinity vô nghĩa.
// - Math.min(...nums) ổn với mảng vừa; mảng hàng trăm nghìn phần tử có thể tràn stack → dùng reduce/vòng lặp.
export function minMax(nums: readonly number[]): [min: number, max: number] | undefined {
  if (nums.length === 0) return undefined;
  return [Math.min(...nums), Math.max(...nums)];
}
