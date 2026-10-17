import { readFileSync } from 'node:fs';
import { Injectable, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { fileExists, readSource, repoPath } from './_kit';
import { CONFIG_KEYS } from './_cfg';

describe('C09 ex01 · @nestjs/config toàn cục + .env.example', () => {
  it('AppModule dùng ConfigModule.forRoot với isGlobal: true', () => {
    const src = readSource('src', 'app.module.ts');
    expect(src).toMatch(/ConfigModule\.forRoot\(/);
    expect(src).toMatch(/isGlobal:\s*true/);
  });

  it('module bất kỳ inject được ConfigService mà không import ConfigModule', async () => {
    @Injectable()
    class Uses {
      constructor(readonly config: ConfigService) {}
    }
    @Module({ providers: [Uses] })
    class Feature {}
    const ref = await Test.createTestingModule({ imports: [AppModule, Feature] }).compile();
    expect(ref.get(Uses, { strict: false }).config).toBeInstanceOf(ConfigService);
    await ref.close();
  });

  it('.env.example liệt kê mọi biến và mô tả cách dùng', () => {
    expect(fileExists('.env.example')).toBe(true);
    const text = readFileSync(repoPath('.env.example'), 'utf8');
    for (const key of CONFIG_KEYS) expect({ key, has: new RegExp(`^${key}=`, 'm').test(text) }).toEqual({ key, has: true });
    expect(text).toMatch(/#/); // có chú thích
  });

  it('.gitignore chặn .env và mọi biến thể (.env.production.local...) nhưng giữ .env.example', () => {
    const lines = readFileSync(repoPath('.gitignore'), 'utf8').split(/\r?\n/).map((l) => l.trim());
    expect(lines).toContain('.env');
    expect(lines.some((l) => l === '.env.*' || l === '.env*')).toBe(true);
    expect(lines).toContain('!.env.example');
  });

  it('.env.example không chứa bí mật thật (chỉ giá trị giữ chỗ)', () => {
    const text = readFileSync(repoPath('.env.example'), 'utf8');
    for (const m of text.matchAll(/^(JWT_[A-Z_]+|ADMIN_API_KEY)=(.*)$/gm)) {
      expect({ key: m[1], placeholder: /change-?me|example|xxx|<.*>/i.test(m[2]) }).toEqual({ key: m[1], placeholder: true });
    }
  });
});
