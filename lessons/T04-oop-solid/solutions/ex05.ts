// ex05 · createNotifier — đáp án best practice (Factory)
//
// - Config là discriminated union → mỗi nhánh có đúng field cần thiết; thiếu url là lỗi biên dịch.
// - Factory là NƠI DUY NHẤT biết các implementation cụ thể; phần còn lại của app chỉ thấy SimpleNotifier.
// - switch exhaustive (never) → thêm loại mới mà quên case là lỗi biên dịch.
// - State của memory notifier nằm trong closure của từng lần tạo → mỗi notifier đếm riêng.
// Trong NestJS: useFactory: (config: ConfigService) => createNotifier(config.get('notifier')) (C03).
export type NotifierConfig = { type: 'console'; prefix: string } | { type: 'memory' } | { type: 'webhook'; url: string };

export interface SimpleNotifier {
  send(to: string, body: string): Promise<string>;
}

export function createNotifier(config: NotifierConfig): SimpleNotifier {
  switch (config.type) {
    case 'console':
      return { send: async (to, body) => `${config.prefix} ${to}: ${body}` };
    case 'memory': {
      const stored: { to: string; body: string }[] = [];
      return {
        send: async (to, body) => {
          stored.push({ to, body });
          return `stored #${stored.length}`;
        },
      };
    }
    case 'webhook':
      return { send: async () => `POST ${config.url}` };
    default: {
      const unreachable: never = config;
      throw new Error(`Unknown notifier: ${JSON.stringify(unreachable)}`);
    }
  }
}
