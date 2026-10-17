import { spawn } from 'node:child_process';

export function runCommand(cmd, args = [], options = {}) {
  const { timeoutMs = 0, input, maxBuffer = 1024 * 1024, cwd, env } = options;
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env, shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let size = 0;
    let settled = false;
    let timedOut = false;
    let overflow = false;
    let timer;
    let killTimer;

    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(killTimer);
      fn(value);
    };

    const collect = (which) => (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > maxBuffer) {
        if (!overflow) {
          overflow = true;
          child.kill('SIGKILL');
        }
        return;
      }
      if (which === 'out') stdout += chunk;
      else stderr += chunk;
    };
    child.stdout.setEncoding('utf8').on('data', collect('out'));
    child.stderr.setEncoding('utf8').on('data', collect('err'));

    child.on('error', (err) => settle(reject, err)); // ENOENT, EACCES...
    child.on('close', (code, signal) => {
      if (timedOut) {
        settle(reject, Object.assign(new Error(`Command timed out after ${timeoutMs}ms`), { name: 'TimeoutError', stdout, stderr }));
      } else if (overflow) {
        settle(reject, Object.assign(new RangeError('maxBuffer exceeded'), { stdout, stderr }));
      } else {
        settle(resolve, { code, signal, stdout, stderr });
      }
    });

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        killTimer = setTimeout(() => child.kill('SIGKILL'), 200);
      }, timeoutMs);
    }

    child.stdin.on('error', () => {}); // EPIPE nếu con thoát sớm
    child.stdin.end(input);
  });
}
