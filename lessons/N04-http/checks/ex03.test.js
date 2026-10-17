import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouter } from '../answers/ex03.js';

const h = (name) => Object.assign(() => name, { handlerName: name });
const build = () => createRouter()
  .add('GET', '/', h('home'))
  .add('GET', '/orders', h('listOrders'))
  .add('POST', '/orders', h('createOrder'))
  .add('GET', '/orders/new', h('newForm'))
  .add('GET', '/orders/:id', h('getOrder'))
  .add('DELETE', '/orders/:id', h('deleteOrder'))
  .add('GET', '/orders/:id/items/:itemId', h('getItem'));

test('ex03 · khớp route tĩnh và trả handler', () => {
  const r = build().match('GET', '/orders');
  assert.equal(r.handler.handlerName, 'listOrders');
  assert.deepEqual(r.params, {});
});
test('ex03 · khớp gốc "/"', () => {
  assert.equal(build().match('GET', '/').handler.handlerName, 'home');
});
test('ex03 · tham số :id và nhiều tham số', () => {
  const r = build().match('GET', '/orders/42/items/7');
  assert.equal(r.handler.handlerName, 'getItem');
  assert.deepEqual(r.params, { id: '42', itemId: '7' });
});
test('ex03 · route khai báo trước được ưu tiên (/orders/new)', () => {
  assert.equal(build().match('GET', '/orders/new').handler.handlerName, 'newForm');
  assert.equal(build().match('GET', '/orders/newer').handler.handlerName, 'getOrder');
});
test('ex03 · method không phân biệt hoa thường, khớp đúng method', () => {
  assert.equal(build().match('post', '/orders').handler.handlerName, 'createOrder');
  assert.equal(build().match('DELETE', '/orders/9').handler.handlerName, 'deleteOrder');
});
test('ex03 · bỏ qua dấu / ở cuối', () => {
  assert.equal(build().match('GET', '/orders/').handler.handlerName, 'listOrders');
  assert.deepEqual(build().match('GET', '/orders/5/').params, { id: '5' });
});
test('ex03 · phân biệt hoa thường ở path', () => {
  assert.deepEqual(build().match('GET', '/Orders'), { notFound: true });
});
test('ex03 · không khớp → notFound', () => {
  assert.deepEqual(build().match('GET', '/nope'), { notFound: true });
  assert.deepEqual(build().match('GET', '/orders/1/items'), { notFound: true });
  assert.deepEqual(build().match('GET', '/orders/1/items/2/extra'), { notFound: true });
});
test('ex03 · tham số không khớp segment rỗng', () => {
  assert.deepEqual(build().match('GET', '/orders//items/1'), { notFound: true });
});
test('ex03 · sai method → methodNotAllowed + allow đã sắp xếp, không trùng', () => {
  assert.deepEqual(build().match('PUT', '/orders'), { methodNotAllowed: true, allow: ['GET', 'POST'] });
  assert.deepEqual(build().match('PATCH', '/orders/3'), { methodNotAllowed: true, allow: ['DELETE', 'GET'] });
  assert.deepEqual(build().match('POST', '/'), { methodNotAllowed: true, allow: ['GET'] });
});
test('ex03 · params được decodeURIComponent', () => {
  const r = createRouter().add('GET', '/users/:name', h('u')).match('GET', '/users/Nguy%E1%BB%85n%20V%C4%83n');
  assert.deepEqual(r.params, { name: 'Nguyễn Văn' });
  const slash = createRouter().add('GET', '/f/:p', h('f')).match('GET', '/f/a%2Fb');
  assert.deepEqual(slash.params, { p: 'a/b' });
});
test('ex03 · mã hóa phần trăm sai → HttpError 400', () => {
  const router = createRouter().add('GET', '/users/:name', h('u'));
  assert.throws(() => router.match('GET', '/users/%E0%A4%A'), (e) => e.name === 'HttpError' && e.status === 400 && e.message === 'Bad Request');
});
test('ex03 · add trả router để nối chuỗi', () => {
  const r = createRouter();
  assert.equal(r.add('GET', '/a', h('a')), r);
});
