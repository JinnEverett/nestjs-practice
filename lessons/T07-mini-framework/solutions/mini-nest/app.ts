// mini-nest · createApp — đáp án best practice
//
// Khởi động (một lần): đăng ký → resolve TẤT CẢ provider/controller (lỗi DI lộ ra ngay khi start, không đợi request)
// → onModuleInit tuần tự theo thứ tự tạo → biên dịch route thành regex.
// Mỗi request: khớp route → dựng tham số → await handler → map kết quả/lỗi ra status.
// - handle() thuần (không phụ thuộc HTTP) → test nhanh, và listen() chỉ là lớp mỏng bọc node:http
//   (giống Nest tách core khỏi platform Express/Fastify).
// - Lỗi không phải HttpError → 500 với message chung; chi tiết nên log (P01) chứ không trả client.
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Container, type Provider, type Token } from './container.js';
import { HttpError, getParamDefs, getPrefix, getRouteDefs, type HttpMethod, type ParamDef } from './router.js';

export interface AppRequest {
  method: string;
  url: string;
  body?: unknown;
}
export interface AppResponse {
  status: number;
  body?: unknown;
}

interface CompiledRoute {
  method: HttpMethod;
  regex: RegExp;
  keys: string[];
  invoke: (args: unknown[]) => unknown;
  params: ParamDef[];
}

const tokenOf = (p: Provider): Token => (typeof p === 'function' ? p : p.provide);
const splitPath = (...parts: string[]) => parts.flatMap((p) => p.split('/')).filter(Boolean);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function compile(...parts: string[]): { regex: RegExp; keys: string[] } {
  const keys: string[] = [];
  const pattern = splitPath(...parts)
    .map((seg) => {
      if (!seg.startsWith(':')) return escapeRegex(seg);
      keys.push(seg.slice(1));
      return '([^/]+)';
    })
    .join('/');
  return { regex: new RegExp(`^/${pattern}$`), keys };
}

export async function createApp({ controllers = [], providers = [] }: { controllers?: Function[]; providers?: Provider[] }) {
  const container = new Container();
  for (const p of providers) container.register(p);
  for (const c of controllers) container.register(c as new (...args: never[]) => unknown);
  for (const p of providers) container.resolve(tokenOf(p));
  const instances = new Map(controllers.map((c) => [c, container.resolve(c as Token) as Record<string, (...a: unknown[]) => unknown>]));

  for (const instance of container.createdInstances) {
    const hook = (instance as { onModuleInit?: () => unknown } | null)?.onModuleInit;
    if (typeof hook === 'function') await hook.call(instance);
  }

  const routes: CompiledRoute[] = controllers.flatMap((cls) => {
    const prefix = getPrefix(cls);
    if (prefix === undefined) throw new Error(`${cls.name} is missing @Controller()`);
    const instance = instances.get(cls)!;
    return getRouteDefs(cls).map(({ method, path, handler }) => ({
      method,
      ...compile(prefix, path),
      invoke: (args: unknown[]) => instance[handler]!(...args),
      params: getParamDefs(cls, handler),
    }));
  });

  async function handle(req: AppRequest): Promise<AppResponse> {
    const url = new URL(req.url, 'http://localhost');
    for (const route of routes) {
      if (route.method !== req.method) continue;
      const match = route.regex.exec(url.pathname);
      if (!match) continue;

      const pathParams = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1]!)]));
      const args: unknown[] = [];
      for (const p of route.params) {
        args[p.index] = p.source === 'param' ? pathParams[p.name!] : p.source === 'query' ? (url.searchParams.get(p.name!) ?? undefined) : req.body;
      }
      try {
        const body = await route.invoke(args);
        return { status: req.method === 'POST' ? 201 : 200, body };
      } catch (error) {
        if (error instanceof HttpError) return { status: error.status, body: { message: error.message } };
        return { status: 500, body: { message: 'Internal server error' } };
      }
    }
    return { status: 404, body: { message: `Cannot ${req.method} ${url.pathname}` } };
  }

  function listen(port = 0): Promise<{ port: number; close(): Promise<void> }> {
    const server = http.createServer(async (req, res) => {
      const send = ({ status, body }: AppResponse) => {
        if (body === undefined) return res.writeHead(status).end();
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }).end(JSON.stringify(body));
      };
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const raw = Buffer.concat(chunks).toString('utf8');
      let body: unknown;
      if (raw.length > 0) {
        try {
          body = JSON.parse(raw);
        } catch {
          return send({ status: 400, body: { message: 'Invalid JSON' } });
        }
      }
      send(await handle({ method: req.method ?? 'GET', url: req.url ?? '/', body }));
    });

    return new Promise((resolve) => {
      server.listen(port, () => {
        resolve({
          port: (server.address() as AddressInfo).port,
          close: () =>
            new Promise<void>((done) => {
              server.closeAllConnections();
              server.close(() => done());
            }),
        });
      });
    });
  }

  return { container, handle, listen };
}
