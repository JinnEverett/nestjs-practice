import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container, Injectable, Inject } from '../answers/mini-nest/index.js';

const CONFIG = Symbol('CONFIG');
interface Config {
  dbUrl: string;
}
abstract class Mailer {
  abstract send(to: string): string;
}
class SmtpMailer extends Mailer {
  send(to: string) {
    return `smtp:${to}`;
  }
}
class DbClient {
  constructor(readonly url: string) {}
}

@Injectable()
class UserService {
  constructor(
    @Inject(CONFIG) readonly config: Config,
    readonly mailer: Mailer,
    @Inject('DB') readonly db: DbClient,
  ) {}
}

test('ex03 · useValue, useClass, useFactory, @Inject', () => {
  let factoryCalls = 0;
  const c = new Container()
    .register({ provide: CONFIG, useValue: { dbUrl: 'postgres://x' } })
    .register({ provide: Mailer, useClass: SmtpMailer })
    .register({
      provide: 'DB',
      useFactory: (config: Config) => {
        factoryCalls++;
        return new DbClient(config.dbUrl);
      },
      inject: [CONFIG],
    })
    .register(UserService);

  const s = c.resolve(UserService);
  assert.equal(s.config.dbUrl, 'postgres://x');
  assert.equal(s.mailer.send('a'), 'smtp:a');
  assert.ok(s.db instanceof DbClient);
  assert.equal(s.db.url, 'postgres://x');
  assert.equal(c.resolve<DbClient>('DB'), s.db);
  assert.equal(factoryCalls, 1);
  assert.equal(c.resolve(Mailer), s.mailer);
});
test('ex03 · token chuỗi chưa đăng ký', () => assert.throws(() => new Container().resolve('NOPE'), /No provider for NOPE/));
