import { createProduct } from './_fixtures';
import { png, sandbox, Sandbox, upload } from './_img';

const MB = 1024 * 1024;

describe('C12 ex02 · giới hạn kích thước và file rỗng', () => {
  let sb: Sandbox;
  beforeAll(async () => {
    sb = await sandbox();
  });
  afterAll(async () => {
    await sb.cleanup();
  });

  it('đúng 2MB được nhận (biên)', async () => {
    const p = await createProduct(sb.app);
    const res = await upload(sb.app, p.id, png(2 * MB)).expect(201);
    expect(res.body.size).toBe(2 * MB);
  });

  it('2MB + 1 byte → 413 payload-too-large (problem+json) và KHÔNG ghi gì xuống đĩa', async () => {
    const p = await createProduct(sb.app);
    const before = sb.files();
    const res = await upload(sb.app, p.id, png(2 * MB + 1)).expect(413);
    expect(res.headers['content-type']).toMatch(/problem\+json/);
    expect(res.body).toMatchObject({ type: 'urn:shop:error:payload-too-large', status: 413 });
    expect(sb.files()).toEqual(before);
  });

  it('file lớn (6MB) bị từ chối nhanh và server vẫn sống', async () => {
    const p = await createProduct(sb.app);
    await upload(sb.app, p.id, png(6 * MB)).expect(413);
    await upload(sb.app, p.id, png(1000)).expect(201);
  });

  it('file rỗng (0 byte) → 4xx, không lưu', async () => {
    const p = await createProduct(sb.app);
    const before = sb.files();
    const res = await upload(sb.app, p.id, Buffer.alloc(0));
    expect([400, 415]).toContain(res.status);
    expect(sb.files()).toEqual(before);
  });
});
