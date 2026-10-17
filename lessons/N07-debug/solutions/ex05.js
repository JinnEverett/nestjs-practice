import { AsyncLocalStorage } from 'node:async_hooks';

const als = new AsyncLocalStorage();
const LEVEL_NAMES = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

export function runWithContext(ctx, fn) {
  return als.run({ ...als.getStore(), ...ctx }, fn); // luôn tạo store mới → không rò ra ngoài
}

export function getContext() {
  const store = als.getStore();
  return store ? { ...store } : undefined;
}

export function setContextValue(key, value) {
  const store = als.getStore();
  if (!store) throw new Error('No active context');
  store[key] = value;
}

export function createContextLogger(logger) {
  return Object.fromEntries(
    LEVEL_NAMES.map((level) => [level, (msg, fields) => logger[level](msg, { ...getContext(), ...fields })]),
  );
}
