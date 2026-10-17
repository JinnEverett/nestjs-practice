export function installSignalHandlers(proc, lifecycle, options = {}) {
  const {
    exit = process.exit, forceAfterMs = 10_000, signals = ['SIGTERM', 'SIGINT'], log = console.error,
  } = options;
  let exited = false;
  let shuttingDown = false;
  let forceTimer;

  const exitOnce = (code) => {
    if (exited) return;
    exited = true;
    clearTimeout(forceTimer);
    exit(code);
  };

  async function shutdown(reason, { alwaysFail = false } = {}) {
    if (shuttingDown) return exitOnce(1); // lần hai: thoát cứng
    shuttingDown = true;
    forceTimer = setTimeout(() => exitOnce(1), forceAfterMs);
    forceTimer.unref?.();
    let ok = false;
    try {
      const report = await lifecycle.shutdown(reason);
      ok = report.every((r) => r.ok);
    } catch (err) {
      log(err);
    }
    exitOnce(ok && !alwaysFail ? 0 : 1);
  }

  const listeners = [];
  const on = (event, fn) => {
    proc.on(event, fn);
    listeners.push([event, fn]);
  };
  for (const sig of signals) on(sig, () => shutdown(sig));
  on('uncaughtException', (err) => { log(err); shutdown('uncaughtException', { alwaysFail: true }); });
  on('unhandledRejection', (err) => { log(err); shutdown('unhandledRejection', { alwaysFail: true }); });

  return {
    uninstall() {
      for (const [event, fn] of listeners) proc.off(event, fn);
      listeners.length = 0;
      clearTimeout(forceTimer);
    },
  };
}
