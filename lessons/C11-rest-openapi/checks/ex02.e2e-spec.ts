import { INestApplication } from '@nestjs/common';
import { createTestApp } from './_kit';
import { Doc, getDoc, PUBLIC_OPERATIONS } from './_doc';

describe('C11 ex02 · đường dẫn, tag, mô tả của từng thao tác', () => {
  let app: INestApplication;
  let doc: Doc;
  beforeAll(async () => {
    app = await createTestApp();
    doc = await getDoc(app);
  });
  afterAll(async () => {
    await app.close();
  });

  it.each(PUBLIC_OPERATIONS)('có %s %s với summary và đúng một tag', (method, path) => {
    const op = doc.paths?.[path]?.[method];
    expect({ path, method, exists: Boolean(op) }).toEqual({ path, method, exists: true });
    expect(typeof op.summary).toBe('string');
    expect(op.summary.length).toBeGreaterThan(3);
    expect(op.tags).toHaveLength(1);
    expect(['products', 'orders', 'system']).toContain(op.tags[0]);
  });

  it('tag đúng nhóm: products / orders / system', () => {
    expect(doc.paths['/v1/orders'].post.tags).toEqual(['orders']);
    expect(doc.paths['/v1/orders/{id}'].get.tags).toEqual(['orders']);
    expect(doc.paths['/v1/products'].get.tags).toEqual(['products']);
    expect(doc.paths['/v2/products'].get.tags).toEqual(['products']);
    expect(doc.paths['/ping'].get.tags).toEqual(['system']);
  });

  it('route nội bộ/ngừng hoạt động không lộ ra: _trace, _scope, _reports, legacy, docs', () => {
    const paths = Object.keys(doc.paths);
    for (const hidden of ['_trace', '_scope', '_reports', 'legacy', 'docs']) {
      expect({ hidden, leaked: paths.filter((p) => p.includes(hidden)) }).toEqual({ hidden, leaked: [] });
    }
  });

  it('operationId duy nhất và ổn định, không chứa ký tự lạ', () => {
    const ids: string[] = [];
    for (const item of Object.values<Doc>(doc.paths)) for (const op of Object.values<Doc>(item)) ids.push(op.operationId);
    expect(ids.every((id) => /^[A-Za-z][A-Za-z0-9_]*$/.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(PUBLIC_OPERATIONS.length);
  });

  it('không có path thừa ngoài danh sách công khai', () => {
    expect(Object.keys(doc.paths).sort()).toEqual([...new Set(PUBLIC_OPERATIONS.map(([, p]) => p))].sort());
  });
});
