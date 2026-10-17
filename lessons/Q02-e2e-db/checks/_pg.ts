/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
// Tạo/xóa database tạm để chạy bộ test của người học song song mà không giẫm nhau.
const { Client } = require('pg') as { Client: new (cfg: { connectionString: string }) => any };

export const BASE_URL = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5434/shop_test';

export function urlFor(db: string): string {
  const u = new URL(BASE_URL);
  u.pathname = `/${db}`;
  return u.toString();
}

async function admin<T>(fn: (c: any) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: urlFor('postgres') });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

export const createDb = (name: string) => admin((c) => c.query(`CREATE DATABASE "${name}"`));
export const dropDb = (name: string) => admin((c) => c.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`));

export async function query<T = any>(url: string, sql: string): Promise<T[]> {
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    return (await c.query(sql)).rows as T[];
  } finally {
    await c.end();
  }
}

export const tempName = (tag: string) => `q02_${tag}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
