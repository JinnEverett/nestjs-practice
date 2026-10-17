# Q01 · Bài tập

Viết test trong `shop-api/src/` cạnh file được test (`*.spec.ts`), chạy bằng `npm test`. Chấm: `bash lessons/check.sh lessons/Q01-unit-test NN|all`.

**Cách chấm khác thường:** bộ chấm (1) chạy spec của bạn trên code của bạn, (2) đo coverage nhánh, (3) chạy lại spec trên các bản **code cố ý sai** (đổi `>=` thành `>`, bỏ một nhánh...). Spec phải bắt được ít nhất 80% lỗi. Khi trượt, bộ chấm cho biết **hành vi nào chưa có test**, không cho biết dòng code.

Để các bản code sai thay vào được, service của bạn phải đúng **hợp đồng ở C03**: tên class và đường dẫn file như dưới, các phụ thuộc inject đúng token/class. Nếu bạn làm C03 theo cách khác (ví dụ `OrdersService` đọc thẳng `PRODUCTS_REPOSITORY`), hãy refactor cho khớp, đó là một phần của bài học "thiết kế để dễ test".

| Test cho | Vị trí spec | Collaborator phải mock (và method được gọi) |
|---|---|---|
| `PricingService` | `src/pricing/pricing.service.spec.ts` | `PRICING_RULES` (`useValue`) |
| `ProductsService` | `src/products/products.service.spec.ts` | `PRODUCTS_REPOSITORY` (6 method của interface), `OrdersService` (`hasOrdersFor`) |
| `OrdersService` | `src/orders/orders.service.spec.ts` | `ProductsService` (`findById`, `adjustStock`), `PricingService` (`quote`), `NOW`, `ORDER_NOTIFIER` (tùy chọn) |
| `OrdersController` | `src/orders/orders.controller.spec.ts` | `OrdersService` (`create`, `findById`) |

`ProductsService` phải có `findById(id): Promise<Product | undefined>` và `adjustStock(id, delta): Promise<void>`; `OrdersService.create` phải gọi chúng (không đi vòng qua repository).

**Pass:** 5/6 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Test `PricingService`
Dựng module test với `PRICING_RULES` là `useValue` (tự khai báo bộ quy tắc trong spec). Phủ **mọi quy tắc nghiệp vụ** mô tả ở C03 ex02: phí ship và ngưỡng miễn phí, `WELCOME10` (phần trăm, trần, đơn tối thiểu, làm tròn), `FREESHIP`, mã lạ (kể cả những tên như `constructor`), chuẩn hóa mã, đầu vào sai (400), `null`/rỗng.
Yêu cầu: spec xanh, `>= 90%` nhánh của `pricing.service.ts`, bắt `>= 80%` lỗi cài sẵn.

### ex02 · Test `ProductsService` với repository giả
Mock `PRODUCTS_REPOSITORY` bằng `jest.fn()` cho từng method. Kiểm: chuẩn hóa SKU/name trước khi gọi `insert`, trùng SKU, xác thực 400, `update` (404, trùng SKU của sản phẩm khác, giữ SKU của chính nó, `null`/`0` được áp dụng), `remove` (404, bị chặn khi đã có đơn và **không** gọi `delete`), `findAll` (lọc, sắp xếp, hòa giá, `total`).
Yêu cầu: spec xanh, `>= 80%` nhánh, bắt `>= 80%` lỗi cài sẵn.

---

## 🟡 Kết hợp

### ex03 · Test `OrdersService` với collaborator giả
Giả `ProductsService`, `PricingService`, `NOW` (giờ cố định) và `ORDER_NOTIFIER` (dựng hai module test: có và không có notifier). Kiểm: đơn dựng từ báo giá, giá lấy từ sản phẩm, gộp dòng trùng, biên tồn kho, 422 khi sản phẩm không có hoặc ngừng bán, **không trừ kho khi đơn bị từ chối**, 400 cho body sai, `findById` (404, trả bản sao), `hasOrdersFor`, notifier (gọi một lần, lỗi của nó không làm hỏng đơn).
Yêu cầu: spec xanh, `>= 80%` nhánh, bắt `>= 80%` lỗi cài sẵn.

### ex04 · Test controller bằng service giả
`OrdersController` dựng bằng `Test.createTestingModule({ controllers, providers })`. Với `create`, truyền một `res` giả `{ location: jest.fn() }` (gợi ý: `res as never`). Kiểm chuyển đúng body, `Location` đúng, trả đúng đơn, và **không** đặt `Location` khi service lỗi; `findOne` chuyển đúng `id`.
Yêu cầu: bắt `>= 80%` lỗi cài sẵn.

### ex05 · 🔮 Đoán kết quả test
Ghi dự đoán vào `shop-api/answers/ex05.txt` (tạo thư mục nếu chưa có; bộ chấm đọc file này), 8 dòng, mỗi dòng `tN: pass` hoặc `tN: fail`, **trước khi chạy**:
```ts
describe('mock semantics', () => {
  const fn = jest.fn();

  it('t1', () => {
    fn.mockReturnValue(1);
    jest.clearAllMocks();
    expect(fn()).toBe(1);
  });

  it('t2', () => {
    jest.resetAllMocks();
    expect(fn()).toBeUndefined();
  });

  it('t3', () => {
    fn.mockResolvedValue(5);
    expect(fn()).toBe(5);
  });

  it('t4', () => {
    expect({ a: 1, b: undefined }).toEqual({ a: 1 });
  });

  it('t5', () => {
    expect({ a: 1, b: undefined }).toStrictEqual({ a: 1 });
  });

  it('t6', () => {
    const f = jest.fn().mockReturnValueOnce(1).mockReturnValue(2);
    expect([f(), f(), f()]).toEqual([1, 2, 2]);
  });

  it('t7', () => {
    const g = jest.fn();
    expect(g).not.toHaveBeenCalled();
    g();
    g(1);
    expect(g).toHaveBeenCalledWith();
    expect(g).toHaveBeenCalledTimes(1);
  });

  it('t8', async () => {
    await expect(Promise.reject(new Error('x'))).rejects.toThrow('y');
  });
});
```
Pass khi đúng `>= 7/8`. Sau đó chạy thật (dán vào một file `.spec.ts` tạm) và giải thích câu sai.

---

## 🔴 Thực tế

### ex06 · "CI đỏ ngẫu nhiên, và test xanh mà vẫn lọt lỗi"
Team báo: pipeline thỉnh thoảng đỏ rồi chạy lại thì xanh; còn lần trước lỗi làm tròn giảm giá lọt production dù "coverage 100%". Rà bốn spec ở trên theo ba tiêu chí:
- Mỗi test có **ít nhất một assertion** (bộ chấm bật `expect.hasAssertions()` cho từng test).
- Chạy với `--randomize` (3 seed khác nhau) vẫn xanh: không test nào dựa vào trạng thái test trước để lại.
- Không dùng giờ thật/ngẫu nhiên/`setTimeout`/`sleep` trong spec.

---

> 📏 Câu hỏi (không chấm): bộ unit test này chạy hết trong bao lâu (`npm test`), và bộ e2e C03 chạy hết trong bao lâu? Nếu có 2000 test mỗi loại, thời gian CI lệch nhau bao nhiêu? Dùng con số đó giải thích kim tự tháp test ở Q04.
