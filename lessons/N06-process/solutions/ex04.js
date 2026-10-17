function withTimeout(promiseLike, ms, name) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout closing "${name}" after ${ms}ms`)), ms);
  });
  return Promise.race([Promise.resolve(promiseLike), timeout]).finally(() => clearTimeout(timer));
}

export function createLifecycle({ timeoutMs = 5000 } = {}) {
  const resources = [];
  let started = false;
  let result;

  const lifecycle = {
    register(name, close) {
      if (started) throw new Error('Lifecycle already shutting down');
      resources.push({ name, close });
      return lifecycle;
    },
    shutdown(reason) {
      started = true;
      result ??= (async () => {
        const report = [];
        for (const { name, close } of [...resources].reverse()) {
          const t0 = performance.now();
          try {
            await withTimeout(Promise.resolve().then(() => close(reason)), timeoutMs, name);
            report.push({ name, ok: true, ms: performance.now() - t0 });
          } catch (error) {
            report.push({ name, ok: false, ms: performance.now() - t0, error });
          }
        }
        return report;
      })();
      return result;
    },
  };
  return lifecycle;
}
