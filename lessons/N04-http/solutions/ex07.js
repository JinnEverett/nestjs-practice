const RETRYABLE_STATUS = new Set([502, 503, 504]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchJson(url, options = {}) {
  const {
    method = 'GET', headers = {}, body, timeoutMs = 2000, retries = 2, backoffMs = 20, idempotent = false,
  } = options;
  // POST/PATCH không idempotent theo mặc định → không tự thử lại
  const safeToRetry = !['POST', 'PATCH'].includes(method.toUpperCase()) || idempotent;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(backoffMs * 2 ** (attempt - 1));
    let retryable;
    try {
      const res = await fetch(url, {
        method,
        headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const text = await res.text();
      if (res.ok) return res.status === 204 || text === '' ? undefined : JSON.parse(text);
      lastError = Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, body: text });
      retryable = RETRYABLE_STATUS.has(res.status);
    } catch (err) {
      lastError = err; // lỗi mạng hoặc TimeoutError
      retryable = true;
    }
    if (!retryable || !safeToRetry) break;
  }
  throw lastError;
}
