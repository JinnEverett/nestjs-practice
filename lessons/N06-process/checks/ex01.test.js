import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEnv } from '../answers/ex01.js';

test('ex01 · KEY=VALUE cơ bản, trim, giá trị rỗng, dấu = trong giá trị', () => {
  assert.deepEqual(loadEnv('A=1\nB = hai \nC=\nURL=postgres://u:p@h/db?x=a=b\n'), {
    A: '1', B: 'hai', C: '', URL: 'postgres://u:p@h/db?x=a=b',
  });
});
test('ex01 · bỏ dòng trống, comment, dòng rác', () => {
  assert.deepEqual(loadEnv('# comment\n\n   # thụt đầu dòng\nOK=1\nrác không có dấu bằng\n=novalue\n1BAD=x\nBAD-KEY=y\n'), { OK: '1' });
});
test('ex01 · tiền tố export', () => {
  assert.deepEqual(loadEnv('export A=1\n  export   B="x"\n'), { A: '1', B: 'x' });
});
test('ex01 · comment cuối dòng chỉ khi có khoảng trắng trước #', () => {
  assert.deepEqual(loadEnv('A=b # ghi chú\nB=b#c\nC=  d   #   e\n'), { A: 'b', B: 'b#c', C: 'd' });
});
test('ex01 · nháy kép: escape \\n \\t \\" \\\\, giữ khoảng trắng, bỏ comment sau dấu đóng', () => {
  assert.deepEqual(loadEnv('A="dòng1\\ndòng2"\nB="  giữ cách  "  # bỏ\nC="a \\"q\\" b"\nD="tab\\tx"\nE="back\\\\slash"\n'), {
    A: 'dòng1\ndòng2', B: '  giữ cách  ', C: 'a "q" b', D: 'tab\tx', E: 'back\\slash',
  });
});
test('ex01 · nháy kép nhiều dòng (khóa PEM)', () => {
  const env = 'KEY="-----BEGIN-----\nabc\ndef\n-----END-----"\nNEXT=1\n';
  assert.deepEqual(loadEnv(env), { KEY: '-----BEGIN-----\nabc\ndef\n-----END-----', NEXT: '1' });
});
test('ex01 · nháy đơn: nguyên văn, không escape', () => {
  assert.deepEqual(loadEnv("A='a\\nb $x #c'\nB='x' # bỏ\n"), { A: 'a\\nb $x #c', B: 'x' });
});
test('ex01 · nháy kép không đóng → lấy phần còn lại của dòng, dòng sau vẫn đọc', () => {
  assert.deepEqual(loadEnv('A="abc\nB=2\n'), { A: 'abc', B: '2' });
});
test('ex01 · CRLF', () => {
  assert.deepEqual(loadEnv('A=1\r\nB="x\r\ny"\r\nC=3\r\n'), { A: '1', B: 'x\ny', C: '3' });
});
test('ex01 · khóa lặp: giá trị cuối thắng', () => {
  assert.deepEqual(loadEnv('A=1\nA=2\n'), { A: '2' });
});
test('ex01 · không có dòng cuối xuống dòng', () => {
  assert.deepEqual(loadEnv('A=1\nB=2'), { A: '1', B: '2' });
});
test('ex01 · chuỗi rỗng → {}', () => assert.deepEqual(loadEnv(''), {}));
test('ex01 · khóa __proto__ không làm ô nhiễm', () => {
  const r = loadEnv('__proto__=x\nA=1\n');
  assert.equal(({}).x, undefined);
  assert.equal(r.A, '1');
});
