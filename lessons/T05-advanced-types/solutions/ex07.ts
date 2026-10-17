// ex07 · action creator — đáp án best practice
//
// - Extract<CartAction, { type: T }> lấy đúng nhánh union theo type; Omit<…, 'type'> ra payload.
// - Kiểu trả về là đúng nhánh đó → reducer/handler nhận kiểu chính xác.
// - Một ép kiểu ở chỗ ghép `{ type, ...payload }` (TS không chứng minh được phép ghép này với T generic).
// - Giới hạn của TS: PayloadOf<'clear'> là {} — kiểu {} chấp nhận mọi object, nên action('clear', { productId: 1 })
//   KHÔNG bị bắt. Muốn chặt hơn: overload riêng cho action không payload (action('clear')).
// Redux Toolkit createAction, @nestjs/cqrs command class là các biến thể của ý tưởng này.
export type CartAction = { type: 'add'; productId: number; qty: number } | { type: 'remove'; productId: number } | { type: 'clear' };

export type PayloadOf<T extends CartAction['type']> = Omit<Extract<CartAction, { type: T }>, 'type'>;

export function action<T extends CartAction['type']>(type: T, payload: PayloadOf<T>): Extract<CartAction, { type: T }> {
  return { type, ...payload } as Extract<CartAction, { type: T }>;
}
