// ex02 · Notifier — đáp án best practice (Template Method)
//
// - `notify` là khung cố định ở lớp cha: chuẩn hóa → validate → format → send. Lớp con chỉ điền các bước khác nhau
//   → không lớp con nào quên validate.
// - Bước bắt buộc là `abstract` (compiler ép lớp con cài đặt); bước có mặc định là method thường `protected` (override nếu cần).
// - Transport được tiêm qua constructor → test dùng hàm giả.
// Cân nhắc: kế thừa phù hợp khi khung thật sự chung; nếu lớp con bắt đầu "phá khung", chuyển sang composition.
type Transport = (to: string, body: string) => Promise<void>;

export abstract class Notifier {
  async notify(to: string, message: string): Promise<void> {
    const text = message.trim();
    if (text === '') throw new Error('Message must not be empty');
    if (!this.validateRecipient(to)) throw new Error(`Invalid recipient: ${to}`);
    await this.send(to, this.format(text));
  }

  protected abstract validateRecipient(to: string): boolean;
  protected abstract send(to: string, body: string): Promise<void>;

  protected format(message: string): string {
    return message;
  }
}

export class EmailNotifier extends Notifier {
  constructor(private readonly transport: Transport) {
    super();
  }

  protected validateRecipient(to: string): boolean {
    return /^[^\s@]+@[^\s@]+$/.test(to);
  }

  protected override format(message: string): string {
    return `${message}\n--\nShop`;
  }

  protected send(to: string, body: string): Promise<void> {
    return this.transport(to, body);
  }
}

export class SmsNotifier extends Notifier {
  static readonly MAX_LENGTH = 160;

  constructor(private readonly transport: Transport) {
    super();
  }

  protected validateRecipient(to: string): boolean {
    return /^0\d{9}$/.test(to);
  }

  protected override format(message: string): string {
    return message.slice(0, SmsNotifier.MAX_LENGTH);
  }

  protected send(to: string, body: string): Promise<void> {
    return this.transport(to, body);
  }
}
