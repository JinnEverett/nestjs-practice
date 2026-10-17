import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invokeMethod } from '../answers/ex05.js';

const makeRoot = () => ({
  services: {
    mailer: {
      from: 'shop@x.vn',
      send(to, subject) {
        return `${this.from} → ${to}: ${subject}`;
      },
    },
  },
  version() {
    return this.services ? 'has-services' : 'no';
  },
});

test('ex05 · this là object chứa method', () => {
  assert.equal(invokeMethod(makeRoot(), 'services.mailer.send', 'an@x.vn', 'Hi'), 'shop@x.vn → an@x.vn: Hi');
});
test('ex05 · method ở tầng đầu', () => assert.equal(invokeMethod(makeRoot(), 'version'), 'has-services'));
test('ex05 · tầng không tồn tại → TypeError có path', () => {
  assert.throws(() => invokeMethod(makeRoot(), 'services.sms.send'), (e) => e instanceof TypeError && e.message.includes('services.sms.send'));
});
test('ex05 · không phải function → TypeError', () => {
  assert.throws(() => invokeMethod(makeRoot(), 'services.mailer.from'), TypeError);
  assert.throws(() => invokeMethod(makeRoot(), 'services.mailer'), TypeError);
});
test('ex05 · tầng giữa là null → TypeError, không phải lỗi đọc thuộc tính', () => {
  assert.throws(() => invokeMethod({ a: null }, 'a.b.c'), TypeError);
});
