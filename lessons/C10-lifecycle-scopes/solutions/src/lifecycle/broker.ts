import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { LifecycleJournal } from './lifecycle-journal';

export const BROKER = Symbol('BROKER');

export interface Broker {
  connected: boolean;
  close(): Promise<void>;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Provider bất đồng bộ: Nest chờ factory xong rồi mới inject; factory ném lỗi thì ứng dụng không khởi động. */
export const brokerProvider = {
  provide: BROKER,
  inject: [LifecycleJournal],
  useFactory: async (journal: LifecycleJournal): Promise<Broker> => {
    await sleep(20);
    journal.record('broker:connected');
    return {
      connected: true,
      close: async () => {
        journal.record('broker:closed');
      },
    };
  },
};

/** Đóng kết nối khi tắt ứng dụng. Chủ của tài nguyên là nơi dọn tài nguyên. */
@Injectable()
export class BrokerShutdown implements OnApplicationShutdown {
  constructor(@Inject(BROKER) private readonly broker: Broker) {}

  async onApplicationShutdown(): Promise<void> {
    await this.broker.close();
  }
}
