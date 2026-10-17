export async function runJobs(jobs, { batch = 100 } = {}) {
  let done = 0;
  for (const job of jobs) {
    job(); // ném lỗi → reject, các job sau không chạy
    done++;
    if (done % batch === 0) await new Promise((resolve) => setImmediate(resolve));
  }
  return done;
}
