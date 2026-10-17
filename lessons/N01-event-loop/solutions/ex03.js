import { monitorEventLoopDelay } from 'node:perf_hooks';

const NS_PER_MS = 1e6;
const RESOLUTION_MS = 10;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function measureLag(work) {
  const h = monitorEventLoopDelay({ resolution: RESOLUTION_MS });
  h.enable();
  try {
    // Histogram bỏ qua mẫu đầu tiên (chưa có mốc trước) → cho nó chạy 1-2 nhịp trước khi đo.
    await sleep(RESOLUTION_MS * 2);
    await work();
    // Và chỉ ghi mẫu khi timer lấy mẫu CHẠY: work đồng bộ chặn loop rồi trả về ngay thì
    // timer chưa kịp chạy → phải cho loop thêm 1-2 nhịp để mẫu bị trễ được ghi lại.
    await sleep(RESOLUTION_MS * 2);
  } finally {
    h.disable(); // luôn tắt, kể cả khi work ném lỗi
  }
  return { maxMs: h.max / NS_PER_MS, p99Ms: h.percentile(99) / NS_PER_MS };
}
