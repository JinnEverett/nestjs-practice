import { Injectable } from '@nestjs/common';

/** Sổ ghi sự kiện vòng đời (singleton). Dùng để quan sát thứ tự hook; không dùng cho dữ liệu nghiệp vụ. */
@Injectable()
export class LifecycleJournal {
  readonly events: string[] = [];

  record(event: string): void {
    this.events.push(event);
  }
}
