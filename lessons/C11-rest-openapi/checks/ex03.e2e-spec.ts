import { INestApplication } from '@nestjs/common';
import { createTestApp } from './_kit';
import { Doc, getDoc, resolve } from './_doc';

describe('C11 ex03 · schema của DTO và tham số truy vấn', () => {
  let app: INestApplication;
  let doc: Doc;
  beforeAll(async () => {
    app = await createTestApp();
    doc = await getDoc(app);
  });
  afterAll(async () => {
    await app.close();
  });
  const schema = (name: string): Doc => doc.components.schemas[name];

  it('CreateProductDto: trường, kiểu, ràng buộc, bắt buộc', () => {
    const s = schema('CreateProductDto');
    expect([...s.required].sort()).toEqual(['name', 'price', 'sku']);
    expect(s.properties.sku).toMatchObject({ type: 'string', pattern: '^[A-Z0-9-]{3,20}$' });
    expect(s.properties.name).toMatchObject({ type: 'string', minLength: 1, maxLength: 120 });
    expect(['number', 'integer']).toContain(s.properties.price.type);
    expect(s.properties.price.minimum).toBe(0);
    expect(s.properties.brand.nullable).toBe(true);
    expect(s.properties.isActive.type).toBe('boolean');
    expect(s.properties.stock.minimum).toBe(0);
    for (const f of ['sku', 'name', 'price']) expect(s.properties[f].example).toBeDefined();
  });

  it('UpdateProductDto: cùng trường nhưng không có trường nào bắt buộc (PartialType của @nestjs/swagger)', () => {
    const s = schema('UpdateProductDto');
    expect(Object.keys(s.properties).sort()).toEqual(Object.keys(schema('CreateProductDto').properties).sort());
    expect(s.required ?? []).toEqual([]);
    expect(s.properties.sku.pattern).toBe('^[A-Z0-9-]{3,20}$');
  });

  it('Product (phản hồi): đủ 10 trường theo CONTRACT', () => {
    const s = schema('Product');
    expect(Object.keys(s.properties).sort()).toEqual(
      ['attributes', 'brand', 'categoryId', 'createdAt', 'id', 'isActive', 'name', 'price', 'sku', 'stock'],
    );
    expect(s.properties.createdAt.format).toBe('date-time');
    expect(s.required).toEqual(expect.arrayContaining(['id', 'sku', 'price', 'createdAt']));
  });

  it('Order, OrderItem, CreateOrderDto, CreateOrderItemDto và quan hệ lồng nhau', () => {
    const order = schema('Order');
    expect(Object.keys(order.properties).sort()).toEqual(
      ['createdAt', 'discountAmount', 'discountCode', 'id', 'items', 'shippingFee', 'status', 'totalAmount', 'updatedAt', 'userId'],
    );
    expect(order.properties.status.enum).toEqual(['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded']);
    expect(order.properties.items.type).toBe('array');
    expect(resolve(doc, order.properties.items.items)).toBe(schema('OrderItem'));
    const create = schema('CreateOrderDto');
    expect(create.required).toEqual(['items']);
    expect(create.properties.items).toMatchObject({ type: 'array', minItems: 1, maxItems: 50 });
    expect(schema('CreateOrderItemDto').properties.quantity).toMatchObject({ minimum: 1, maximum: 100 });
  });

  it('GET /v1/products có đủ tham số query kèm ràng buộc', () => {
    const params: Doc[] = doc.paths['/v1/products'].get.parameters;
    const by = Object.fromEntries(params.map((p) => [p.name, p]));
    expect(Object.keys(by).sort()).toEqual(['brand', 'isActive', 'limit', 'maxPrice', 'minPrice', 'page', 'q', 'sort']);
    for (const p of params) expect(p.in).toBe('query');
    for (const p of params) expect(p.required).toBe(false);
    expect(by.page.schema).toMatchObject({ minimum: 1, default: 1 });
    expect(by.limit.schema).toMatchObject({ minimum: 1, maximum: 100, default: 20 });
    expect(by.sort.schema.pattern).toContain('id|price|name|createdAt|stock');
    expect(by.isActive.schema.type).toBe('boolean');
    expect(typeof by.sort.description).toBe('string');
  });

  it('tham số path :id có kiểu số nguyên/số và bắt buộc', () => {
    const p = doc.paths['/v1/products/{id}'].get.parameters.find((x: Doc) => x.name === 'id');
    expect(p).toMatchObject({ in: 'path', required: true });
    expect(['number', 'integer']).toContain(p.schema.type);
  });
});
