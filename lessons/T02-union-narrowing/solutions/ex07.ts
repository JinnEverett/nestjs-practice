// ex07 · createDispatcher — đáp án best practice
//
// - Handlers là mapped type theo từng `type` của union: { [K in AppEvent['type']]: (e: Extract<AppEvent, { type: K }>) => void }
//   → thiếu key là lỗi, mỗi handler nhận đúng nhánh của union.
// - Khi dispatch, TS không tự "nối" được event.type với kiểu handler tương ứng (giới hạn đã biết của TS với
//   correlated union) → một lần ép kiểu hẹp ở ĐÚNG MỘT CHỖ bên trong hàm, có comment giải thích. API công khai vẫn an toàn tuyệt đối.
// Thực tế: @nestjs/event-emitter với @OnEvent('order.created') (M02).
export type AppEvent = { type: 'order.created'; orderId: number; total: number } | { type: 'user.registered'; email: string };

export type Handlers = { [K in AppEvent['type']]: (event: Extract<AppEvent, { type: K }>) => void };

export function createDispatcher(handlers: Handlers): (event: AppEvent) => void {
  return (event) => {
    // event.type và handler tương ứng luôn khớp nhau theo định nghĩa Handlers; TS không chứng minh được điều này.
    const handler = handlers[event.type] as (e: AppEvent) => void;
    handler(event);
  };
}
