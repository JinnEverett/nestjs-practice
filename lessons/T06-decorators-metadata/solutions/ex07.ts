// ex07 · Retry / Timeout — đáp án best practice
//
// - Hai decorator độc lập, mỗi cái bọc đúng một hành vi → ghép theo thứ tự để có ngữ nghĩa khác nhau:
//   @Retry @Timeout m() = Retry(Timeout(m)) → mỗi lần thử bị giới hạn; @Timeout @Retry m() → giới hạn tổng.
// - Wrapper là `async function` thường → giữ this, luôn trả Promise.
// - Timeout clearTimeout trong finally. (Không hủy được việc bên dưới — cần AbortSignal, xem J11.)
// Trong NestJS: TimeoutInterceptor + RxJS timeout()/retry() làm việc này ở tầng interceptor (C08, P09).
import 'reflect-metadata';
import { setTimeout as sleep } from 'node:timers/promises';

type AsyncMethod = (this: unknown, ...args: unknown[]) => Promise<unknown>;

export function Retry({ times, delayMs = 0 }: { times: number; delayMs?: number }) {
  return (_target: object, _key: string | symbol, descriptor: PropertyDescriptor): void => {
    const original = descriptor.value as AsyncMethod;
    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      for (let attempt = 0; ; attempt++) {
        try {
          return await original.apply(this, args);
        } catch (error) {
          if (attempt >= times) throw error;
          if (delayMs > 0) await sleep(delayMs);
        }
      }
    };
  };
}

export function Timeout(ms: number) {
  return (_target: object, key: string | symbol, descriptor: PropertyDescriptor): void => {
    const original = descriptor.value as AsyncMethod;
    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      let timer: NodeJS.Timeout | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error(`${String(key)} timed out after ${ms}ms`), { name: 'TimeoutError' })), ms);
      });
      try {
        return await Promise.race([original.apply(this, args), timeout]);
      } finally {
        clearTimeout(timer);
      }
    };
  };
}
