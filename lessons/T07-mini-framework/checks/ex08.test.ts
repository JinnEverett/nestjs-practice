import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, Controller, Get, Post, Body, Param } from '../answers/mini-nest/index.js';

@Controller('echo')
class EchoController {
  @Post()
  echo(@Body() body: unknown) {
    return { received: body };
  }
  @Get(':word')
  shout(@Param('word') word: string) {
    return { word: word.toUpperCase() };
  }
}

test('ex08 · HTTP thật', async () => {
  const app = await createApp({ controllers: [EchoController] });
  const server = await app.listen(0);
  try {
    const base = `http://127.0.0.1:${server.port}`;
    const r1 = await fetch(`${base}/echo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a: 1 }) });
    assert.equal(r1.status, 201);
    assert.match(r1.headers.get('content-type') ?? '', /application\/json/);
    assert.deepEqual(await r1.json(), { received: { a: 1 } });

    const r2 = await fetch(`${base}/echo/xin%20chao`);
    assert.deepEqual(await r2.json(), { word: 'XIN CHAO' });

    const r3 = await fetch(`${base}/echo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' });
    assert.equal(r3.status, 400);
    assert.deepEqual(await r3.json(), { message: 'Invalid JSON' });

    const r4 = await fetch(`${base}/nope`);
    assert.equal(r4.status, 404);
  } finally {
    await server.close();
  }
});
