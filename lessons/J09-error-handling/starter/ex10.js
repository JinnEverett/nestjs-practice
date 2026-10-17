// J09 · ex10 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex10.txt
class MyError extends Error {}
class NamedError extends Error {
  constructor(m) {
    super(m);
    this.name = 'NamedError';
  }
}
const e1 = new MyError('x');
console.log('A', e1.name, e1 instanceof MyError, e1 instanceof Error);
console.log('B', String(new NamedError('lỗi')));
console.log('C', JSON.stringify(new Error('mất')));
console.log('D', Object.keys(new Error('m')).length);
const withCause = new Error('ngoài', { cause: 'trong' });
console.log('E', withCause.cause);
const custom = Object.assign(new Error('có code'), { code: 'E_CODE' });
console.log('F', JSON.stringify(custom));
console.log('G', new Error('dòng 1').stack.split('\n')[0]);
const agg = new AggregateError([new Error('a'), new Error('b')], 'nhiều lỗi');
console.log('H', agg.errors.length, agg.message);
console.log('I', typeof Error.captureStackTrace);
