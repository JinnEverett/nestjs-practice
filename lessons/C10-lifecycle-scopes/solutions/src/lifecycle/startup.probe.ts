import {
  BeforeApplicationShutdown,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { LifecycleJournal } from './lifecycle-journal';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

@Injectable()
export class StartupProbe
  implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy, BeforeApplicationShutdown, OnApplicationShutdown
{
  constructor(private readonly journal: LifecycleJournal) {}

  async onModuleInit(): Promise<void> {
    await sleep(15); // mô phỏng mở kết nối: Nest CHỜ hook async xong rồi mới đi tiếp
    this.journal.record('StartupProbe:onModuleInit');
  }

  onApplicationBootstrap(): void {
    this.journal.record('StartupProbe:onApplicationBootstrap');
  }

  onModuleDestroy(): void {
    this.journal.record('StartupProbe:onModuleDestroy');
  }

  beforeApplicationShutdown(): void {
    this.journal.record('StartupProbe:beforeApplicationShutdown');
  }

  onApplicationShutdown(): void {
    this.journal.record('StartupProbe:onApplicationShutdown');
  }
}
