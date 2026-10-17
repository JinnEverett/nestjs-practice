// ex04 · RouteParams / buildPath — đáp án best practice
//
// - Template literal + infer tách chuỗi path lúc biên dịch: tìm `:param` rồi đệ quy phần còn lại.
// - Record<RouteParams<P>, …> → object params phải có ĐÚNG các key đó (object literal thừa key bị bắt).
// - Path không có param → Record<never, …> = {}.
// - Lúc chạy: regex thay `:name` (tên gồm chữ, số, _) bằng giá trị đã encode (chặn '/' hay khoảng trắng phá URL).
// NestJS dùng cú pháp `:id` y hệt trong @Get(':id') (C02).
export type RouteParams<P extends string> = P extends `${string}:${infer Param}/${infer Rest}`
  ? Param | RouteParams<`/${Rest}`>
  : P extends `${string}:${infer Param}`
    ? Param
    : never;

export function buildPath<P extends string>(path: P, params: Record<RouteParams<P>, string | number>): string {
  const values: Record<string, string | number> = params;
  return path.replace(/:(\w+)/g, (_, name: string) => {
    const value = values[name];
    if (value === undefined) throw new Error(`Missing route param: ${name}`);
    return encodeURIComponent(String(value));
  });
}
