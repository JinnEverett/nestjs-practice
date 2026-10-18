import { Module } from '@nestjs/common';
import { BrokerShutdown, brokerProvider } from './broker';
import { LifecycleJournal } from './lifecycle-journal';
import { ConsumerA, ConsumerB, RequestScopedService, ScopeController, SingletonService, TransientService } from './scopes';
import { StartupProbe } from './startup.probe';

@Module({
  controllers: [ScopeController],
  providers: [
    LifecycleJournal,
    StartupProbe,
    brokerProvider,
    BrokerShutdown,
    SingletonService,
    RequestScopedService,
    TransientService,
    ConsumerA,
    ConsumerB,
  ],
  exports: [LifecycleJournal],
})
export class LifecycleModule {}
