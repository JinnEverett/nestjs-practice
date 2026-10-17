// ex08 · TokenBucket — đáp án best practice
//
// - Không dùng setInterval để nạp token: tính "lười" (lazy) khi được hỏi — số token nạp thêm =
//   thời gian trôi qua × tốc độ. Không timer, không rò rỉ, chính xác tới mili giây.
// - Lưu tokens dạng số thực → phần lẻ được cộng dồn qua nhiều lần (4 × 250ms = 1 token).
// - #refill() là bước chung của mọi thao tác đọc/ghi.
// - Đồng hồ tiêm vào (now) → test được không cần chờ.
// Production: @nestjs/throttler, hoặc token bucket trên Redis (Lua script) khi chạy nhiều instance.
export class TokenBucket {
  #capacity;
  #ratePerMs;
  #now;
  #tokens;
  #last;

  constructor({ capacity, refillPerSecond, now = Date.now }) {
    this.#capacity = capacity;
    this.#ratePerMs = refillPerSecond / 1000;
    this.#now = now;
    this.#tokens = capacity;
    this.#last = now();
  }

  get available() {
    this.#refill();
    return Math.floor(this.#tokens);
  }

  tryRemove(n = 1) {
    this.#refill();
    if (this.#tokens < n) return false;
    this.#tokens -= n;
    return true;
  }

  #refill() {
    const t = this.#now();
    this.#tokens = Math.min(this.#capacity, this.#tokens + (t - this.#last) * this.#ratePerMs);
    this.#last = t;
  }
}
