// Mã của bài 🔮 ex02 (giống hệt trong exercises.md). Check chạy thật để lấy thứ tự đúng.
import { Injectable, Module, OnApplicationBootstrap, OnApplicationShutdown, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Test } from '@nestjs/testing';

export async function runOrder(): Promise<string[]> {
  const log: string[] = [];
  const mark = (s: string) => void log.push(s);

  @Injectable()
  class Db implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy, OnApplicationShutdown {
    constructor() { mark('Db:constructor'); }
    onModuleInit() { mark('Db:onModuleInit'); }
    onApplicationBootstrap() { mark('Db:onApplicationBootstrap'); }
    onModuleDestroy() { mark('Db:onModuleDestroy'); }
    onApplicationShutdown() { mark('Db:onApplicationShutdown'); }
  }

  @Injectable()
  class Repo {
    constructor(_db: Db) { mark('Repo:constructor'); }
  }

  @Injectable()
  class Service implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy, OnApplicationShutdown {
    constructor(_repo: Repo) { mark('Service:constructor'); }
    onModuleInit() { mark('Service:onModuleInit'); }
    onApplicationBootstrap() { mark('Service:onApplicationBootstrap'); }
    onModuleDestroy() { mark('Service:onModuleDestroy'); }
    onApplicationShutdown() { mark('Service:onApplicationShutdown'); }
  }

  @Module({ providers: [Db], exports: [Db] })
  class DbModule {}

  @Module({ imports: [DbModule], providers: [Repo, Service] })
  class AppModule {}

  const ref = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = ref.createNestApplication();
  await app.init();
  await app.close();
  return log;
}
