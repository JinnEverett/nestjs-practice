import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCommand } from '../answers/ex05.js';

const node = (code, opts) => runCommand(process.execPath, ['-e', code], opts);

test('ex05 · thu stdout/stderr và mã thoát 0', async () => {
  const r = await node('console.log("xin chào"); console.error("cảnh báo")');
  assert.equal(r.code, 0);
  assert.equal(r.signal, null);
  assert.equal(r.stdout.trim(), 'xin chào');
  assert.equal(r.stderr.trim(), 'cảnh báo');
});
test('ex05 · mã thoát ≠ 0 vẫn resolve', async () => {
  const r = await node('process.exit(3)');
  assert.equal(r.code, 3);
});
test('ex05 · input → stdin', async () => {
  const r = await node('let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(s.toUpperCase()))', { input: 'đơn hàng' });
  assert.equal(r.stdout.trim(), 'ĐƠN HÀNG');
});
test('ex05 · không có input vẫn đóng stdin (chương trình đọc stdin không treo)', async () => {
  const r = await node('process.stdin.resume();process.stdin.on("end",()=>console.log("eof"))', { timeoutMs: 3000 });
  assert.equal(r.stdout.trim(), 'eof');
});
test('ex05 · lệnh không tồn tại → reject ENOENT', async () => {
  await assert.rejects(runCommand('lenh-khong-ton-tai-xyz', []), { code: 'ENOENT' });
});
test('ex05 · đối số có ký tự đặc biệt truyền NGUYÊN VĂN (không qua shell)', async () => {
  const evil = '$(echo hacked); echo "x" && `id` | cat > /dev/null';
  const r = await runCommand(process.execPath, ['-e', 'console.log(process.argv[1])', evil]);
  assert.equal(r.stdout.trim(), evil);
});
test('ex05 · timeout → TimeoutError kèm stdout đã thu, tiến trình bị kill', async () => {
  const t0 = performance.now();
  await assert.rejects(
    node('console.log("bắt đầu"); setInterval(()=>{}, 1000)', { timeoutMs: 400 }),
    (e) => {
      assert.equal(e.name, 'TimeoutError');
      assert.match(e.stdout, /bắt đầu/);
      return true;
    },
  );
  assert.ok(performance.now() - t0 < 3000);
});
test('ex05 · timeout: tiến trình lì (bỏ qua SIGTERM) vẫn bị SIGKILL', async (t) => {
  if (process.platform === 'win32') return t.skip('Windows: kill luôn là cưỡng bức');
  await assert.rejects(
    node('process.on("SIGTERM",()=>{});console.log("sống");setInterval(()=>{},1000)', { timeoutMs: 300 }),
    { name: 'TimeoutError' },
  );
});
test('ex05 · vượt maxBuffer → RangeError và tiến trình bị dừng', async () => {
  await assert.rejects(
    node('while(true){process.stdout.write("x".repeat(10000))}', { maxBuffer: 50_000, timeoutMs: 5000 }),
    (e) => e instanceof RangeError,
  );
});
test('ex05 · cwd và env được áp dụng', async () => {
  const r = await node('console.log(process.env.GREETING, process.cwd())', { cwd: process.cwd(), env: { ...process.env, GREETING: 'chào' } });
  assert.match(r.stdout, /^chào /);
});
