import { Controller, Get, Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';

/** Đếm số lần constructor chạy để nhìn thấy chi phí của từng scope. */
export const counters = { singleton: 0, request: 0, transient: 0 };

@Injectable()
export class SingletonService {
  readonly id = randomUUID();
  constructor() {
    counters.singleton++;
  }
}

@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  readonly id = randomUUID();
  // REQUEST có thể là undefined khi provider được dựng ngoài HTTP (moduleRef.resolve không kèm request).
  constructor(@Inject(REQUEST) private readonly req?: Request) {
    counters.request++;
  }

  get requestId(): string | undefined {
    const h = this.req?.headers?.['x-request-id'];
    return typeof h === 'string' ? h : undefined;
  }
}

@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {
  readonly id = randomUUID();
  constructor() {
    counters.transient++;
  }
}

/** Chỉ phụ thuộc TRANSIENT: vẫn là singleton, giữ một instance Transient riêng suốt đời ứng dụng. */
@Injectable()
export class ConsumerA {
  constructor(readonly transient: TransientService) {}
}

/** Phụ thuộc REQUEST: scope "nổi" lên, B bị dựng lại ở MỖI request (kéo theo Transient của nó). */
@Injectable()
export class ConsumerB {
  constructor(
    readonly transient: TransientService,
    readonly request: RequestScopedService,
  ) {}
}

@Controller({ path: '_scope', version: '1' })
export class ScopeController {
  constructor(
    private readonly requestScoped: RequestScopedService,
    private readonly singleton: SingletonService,
    private readonly a: ConsumerA,
    private readonly b: ConsumerB,
  ) {}

  @Get()
  show() {
    return {
      requestId: this.requestScoped.requestId,
      requestScopedId: this.requestScoped.id,
      singletonId: this.singleton.id,
      transientIds: [this.a.transient.id, this.b.transient.id],
    };
  }
}
