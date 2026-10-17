// ex08 · reduceFetch — đáp án best practice
//
// - Union trạng thái: không thể có `success` mà thiếu data, hay vừa loading vừa có error.
// - Reducer là hàm thuần: (state, action) → state mới; không đổi thì trả ĐÚNG object cũ (UI/memo dựa vào đó).
// - switch trên action.type + assertNever; kiểm state.status bên trong từng case.
// - Generic T xuyên suốt: data trong success có đúng kiểu T.
export type FetchState<T> = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: string };

export type FetchAction<T> = { type: 'start' } | { type: 'resolve'; data: T } | { type: 'reject'; error: string } | { type: 'reset' };

const assertNever = (x: never): never => {
  throw new Error(`Unhandled action: ${JSON.stringify(x)}`);
};

export function reduceFetch<T>(state: FetchState<T>, action: FetchAction<T>): FetchState<T> {
  switch (action.type) {
    case 'start':
      return state.status === 'loading' ? state : { status: 'loading' };
    case 'resolve':
      return state.status === 'loading' ? { status: 'success', data: action.data } : state;
    case 'reject':
      return state.status === 'loading' ? { status: 'error', error: action.error } : state;
    case 'reset':
      return { status: 'idle' };
    default:
      return assertNever(action);
  }
}
