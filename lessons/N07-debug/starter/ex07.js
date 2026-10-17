// Chạy 6 kịch bản trong tiến trình con và in kết quả. Đừng chạy trước khi đoán!
import { spawnSync } from 'node:child_process';

const cases = {
  A_reject_khong_bat: `Promise.reject(new Error('A hỏng'))`,
  B_co_listener_unhandled: `process.on('unhandledRejection', () => console.log('đã xử lý')); Promise.reject(new Error('B'))`,
  C_uncaught_co_listener: `
    process.on('uncaughtException', (e) => console.log('bắt được', e.message));
    setTimeout(() => { throw new Error('C bùm'); }, 10);
    setTimeout(() => console.log('vẫn sống'), 40);`,
  D_exitCode_roi_cho_loop: `process.exitCode = 3; setTimeout(() => console.log('muộn'), 10);`,
  E_exit_giua_chung: `
    process.on('exit', (c) => console.log('exit', c));
    setTimeout(() => console.log('không bao giờ in'), 50);
    process.exit(5);`,
  F_beforeExit_hoi_sinh: `
    let revived = false;
    process.on('beforeExit', () => { if (!revived) { revived = true; setTimeout(() => console.log('hồi sinh'), 5); } });
    console.log('xong việc chính');`,
};

for (const [name, code] of Object.entries(cases)) {
  const r = spawnSync(process.execPath, ['-e', code], { encoding: 'utf8', timeout: 10_000 });
  const out = r.stdout.trim().split(/\r?\n/).filter(Boolean).join(' | ');
  console.log(`${name}: code=${r.status} stdout=${JSON.stringify(out)} stderrCoLoi=${/Error/.test(r.stderr)}`);
}
