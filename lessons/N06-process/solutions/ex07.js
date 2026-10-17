import { spawn } from 'node:child_process';

export function superviseChild(options) {
  const { cmd, args = [], maxRestarts = 3, backoffMs = 20, stableMs = 1000, onEvent = () => {} } = options;
  let starts = 0;
  let consecutive = 0;
  let stopped = false;
  let child = null;
  let backoffTimer = null;
  let finish;
  const done = new Promise((resolve) => { finish = resolve; });

  function start() {
    starts++;
    const startedAt = performance.now();
    onEvent({ type: 'start', starts });
    child = spawn(cmd, args, { stdio: 'ignore', shell: false });
    let ended = false;
    const onEnd = (code, signal, error) => {
      if (ended) return;
      ended = true;
      child = null;
      onEvent({ type: 'exit', code, signal, error });
      if (stopped) return finish({ reason: 'stopped', starts });
      if (code === 0) return finish({ reason: 'exited', starts });

      if (performance.now() - startedAt >= stableMs) consecutive = 0;
      consecutive++;
      if (consecutive > maxRestarts) {
        onEvent({ type: 'give-up', starts });
        return finish({ reason: 'max-restarts', starts });
      }
      const delay = backoffMs * 2 ** (consecutive - 1);
      onEvent({ type: 'restart', in: delay });
      backoffTimer = setTimeout(start, delay);
    };
    child.on('close', (code, signal) => onEnd(code, signal));
    child.on('error', (err) => onEnd(null, null, err));
  }

  start();

  return {
    done,
    async stop() {
      if (stopped) return done;
      stopped = true;
      onEvent({ type: 'stop' });
      if (backoffTimer) {
        clearTimeout(backoffTimer);
        finish({ reason: 'stopped', starts });
      } else if (child) {
        child.kill('SIGKILL');
      }
      return done;
    },
  };
}
