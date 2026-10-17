import { INestApplication } from '@nestjs/common';
import { ApiPaginatedResponse } from '../../src/common/swagger/api-paginated-response.decorator';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';
import { Doc, getDoc, resolve } from './_doc';

describe('C11 ex05 · envelope phân trang chuẩn trong OpenAPI', () => {
  let app: INestApplication;
  let doc: Doc;
  beforeAll(async () => {
    app = await createTestApp();
    doc = await getDoc(app);
  });
  afterAll(async () => {
    await app.close();
  });

  it('có decorator dùng lại được ApiPaginatedResponse(Model)', () => {
    expect(typeof ApiPaginatedResponse).toBe('function');
  });

  it('component PaginationMetaDto: page, limit, total (bắt buộc)', () => {
    const s = doc.components.schemas.PaginationMetaDto;
    expect(Object.keys(s.properties).sort()).toEqual(['limit', 'page', 'total']);
    expect([...s.required].sort()).toEqual(['limit', 'page', 'total']);
  });

  it('GET /v1/products 200: { data: Product[], meta: PaginationMetaDto }', () => {
    const schema = doc.paths['/v1/products'].get.responses['200'].content['application/json'].schema;
    expect(schema.properties.data.type).toBe('array');
    expect(resolve(doc, schema.properties.data.items)).toBe(doc.components.schemas.Product);
    expect(resolve(doc, schema.properties.meta)).toBe(doc.components.schemas.PaginationMetaDto);
    expect([...schema.required].sort()).toEqual(['data', 'meta']);
  });

  it('GET /v2/products có hình dạng riêng: { items, pagination{page,limit,total,pages} }', () => {
    const ref = doc.paths['/v2/products'].get.responses['200'].content['application/json'].schema;
    const s = resolve(doc, ref);
    expect(Object.keys(s.properties).sort()).toEqual(['items', 'pagination']);
    const pg = resolve(doc, s.properties.pagination);
    expect(Object.keys(pg.properties).sort()).toEqual(['limit', 'page', 'pages', 'total']);
  });

  it('thân thật của GET /v1/products có đúng các khóa đã công bố', async () => {
    await createProduct(app);
    const body = (await http(app).get('/v1/products').expect(200)).body;
    expect(Object.keys(body).sort()).toEqual(['data', 'meta']);
    expect(Object.keys(body.meta).sort()).toEqual(['limit', 'page', 'total']);
    const declared = Object.keys(doc.components.schemas.Product.properties).sort();
    expect(Object.keys(body.data[0]).sort()).toEqual(declared);
  });
});
