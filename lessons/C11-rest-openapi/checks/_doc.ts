import { INestApplication } from '@nestjs/common';
import { http } from './_kit';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Doc = any;
export const getDoc = async (app: INestApplication): Promise<Doc> => (await http(app).get('/docs-json').expect(200)).body;

export const PUBLIC_OPERATIONS: [method: string, path: string][] = [
  ['get', '/ping'],
  ['get', '/v1/products'], ['post', '/v1/products'],
  ['get', '/v1/products/count'],
  ['get', '/v1/products/{id}'], ['patch', '/v1/products/{id}'], ['delete', '/v1/products/{id}'],
  ['get', '/v2/products'],
  ['get', '/v1/p/{sku}'],
  ['post', '/v1/orders'], ['get', '/v1/orders/{id}'],
];
export const WRITE_OPERATIONS: [string, string][] = [
  ['post', '/v1/products'], ['patch', '/v1/products/{id}'], ['delete', '/v1/products/{id}'], ['post', '/v1/orders'],
];

export const resolve = (doc: Doc, node: any): any => {
  if (node?.$ref) return node.$ref.replace('#/', '').split('/').reduce((n: any, k: string) => n?.[k], doc);
  return node;
};
