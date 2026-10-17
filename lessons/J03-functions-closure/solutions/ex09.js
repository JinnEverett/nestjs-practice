// ex09 · composeMiddleware — đáp án best practice (giống koa-compose, bản đồng bộ)
//
// - `dispatch(i)` gọi middleware thứ i và truyền cho nó `next = () => dispatch(i + 1)`.
// - Biến `index` trong closure của MỖI lần run ghi nhớ middleware xa nhất đã được gọi:
//   nếu dispatch(i) được gọi với i <= index nghĩa là next() bị gọi lần hai → lỗi.
//   Đặt `index` bên trong `run` (không phải ngoài) để các lần run độc lập.
// - Hết middleware → trả undefined (next của middleware cuối).
// - Lỗi tự lan ngược qua call stack → middleware ngoài cùng có thể try/catch (giống exception filter).
export function composeMiddleware(middlewares) {
  return function run(ctx) {
    let index = -1;
    const dispatch = (i) => {
      if (i <= index) throw new Error('next() called multiple times');
      index = i;
      const mw = middlewares[i];
      if (!mw) return undefined;
      return mw(ctx, () => dispatch(i + 1));
    };
    return dispatch(0);
  };
}
