# Q01 · Unit test và mock provider

Đọc khoảng 10 phút. Bạn đã có ba service (`PricingService`, `ProductsService`, `OrdersService`) và một controller. Module này viết unit test cho chúng bằng Jest và `Test.createTestingModule`, rồi bị chấm bằng một cách khác thường: **test của bạn phải bắt được những lỗi cài sẵn** (mutation), không chỉ xanh.

## Mục tiêu
- Dựng module test tối thiểu với `Test.createTestingModule({ providers })`, thay dependency bằng `useValue` + `jest.fn()`.
- Phân biệt kiểm **kết quả** (state) với kiểm **tương tác** (mock đã được gọi đúng chưa) và biết khi nào dùng cái nào.
- Viết test cho biên, lỗi, và "không được xảy ra" (`not.toHaveBeenCalled`).
- Hiểu ngữ nghĩa mock của Jest 30 (`clearAllMocks` vs `resetAllMocks`, `mockReturnValue` vs `mockResolvedValue`).
- Đọc coverage đúng cách: nhánh được chạy khác với nhánh được **kiểm**.

## 1. Khung một unit test cho service
```ts
const repo = { findById: jest.fn(), insert: jest.fn() };

beforeEach(async () => {
  jest.resetAllMocks();                       // mock sạch cho mỗi test
  const ref = await Test.createTestingModule({
    providers: [
      ProductsService,                        // lớp thật cần test
      { provide: PRODUCTS_REPOSITORY, useValue: repo },   // phụ thuộc: giả
    ],
  }).compile();
  service = ref.get(ProductsService);
});

it('SKU trùng → 409 và không insert', async () => {
  repo.findBySku.mockResolvedValue(existing);
  await expect(service.create(dto)).rejects.toMatchObject({ status: 409 });
  expect(repo.insert).not.toHaveBeenCalled();       // tương tác "không xảy ra"
});
```
Không `compile()` cả `AppModule`: unit test chỉ dựng lớp cần thử và giả mọi thứ bên ngoài. Nhanh (mili-giây), lỗi chỉ ra đúng chỗ. Test chạm cả HTTP + DI thật là e2e (Q02).

## 2. Mock: dùng đúng chỗ
| Cần | Cách |
|---|---|
| Hàm sync trả giá trị | `fn.mockReturnValue(x)` |
| Hàm async trả giá trị | `fn.mockResolvedValue(x)` (không phải `mockReturnValue`: nhận về Promise) |
| Hàm async ném lỗi | `fn.mockRejectedValue(new Error())` |
| Cài đặt tùy theo đầu vào | `fn.mockImplementation(async (id) => map.get(id))` |
| Lần gọi đầu khác lần sau | `mockReturnValueOnce(a).mockReturnValue(b)` |
| Xóa lịch sử gọi, giữ cài đặt | `jest.clearAllMocks()` |
| Xóa cả cài đặt | `jest.resetAllMocks()` |

Kiểm tương tác khi **tương tác chính là hành vi**: "không trừ kho khi đơn bị từ chối", "notifier được gọi đúng một lần". Với phần còn lại hãy kiểm kết quả: test gắn chặt vào cách cài đặt sẽ gãy mỗi lần refactor mà không phát hiện thêm lỗi nào.

## 3. Cái gì đáng test trong một service
1. **Đường vui** với dữ liệu thực tế (không chỉ `1`, `'a'`).
2. **Biên**: đúng ngưỡng, ngay dưới và ngay trên ngưỡng (`499999`, `500000`; `199999`, `200000`).
3. **Lỗi** nào được ném, mã status nào, và *chưa* có tác dụng phụ (không ghi, không trừ).
4. **Giá trị "falsy hợp lệ"**: `0`, `null`, `''`.
5. **Bất biến**: kết quả trả về là bản sao, tổng tiền khớp công thức.

Coverage cho biết dòng/nhánh nào **đã chạy**, không cho biết bạn có **kiểm** gì. Một test không `expect` vẫn cho coverage 100%. Bộ chấm dùng mutation: thay `>=` bằng `>`, `floor` bằng `round`, bỏ một câu `if`... rồi chạy lại test của bạn. Test tốt phải đỏ.

## 4. Test ổn định
- Mỗi test tự dựng dữ liệu; không dựa vào test chạy trước. Jest 30 có `--randomize` để lộ ra phụ thuộc thứ tự.
- Không `Date.now()`, `Math.random()`, `setTimeout` thật: inject `NOW` (C03) hoặc dùng `jest.useFakeTimers()` (Q03).
- `expect.hasAssertions()` bắt test async quên `await`/quên `expect`.

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| `mockReturnValue(promise)` thay vì `mockResolvedValue` | test pass/fail sai lý do | `mockResolvedValue` |
| Quên `await expect(...).rejects` | test xanh dù không ném lỗi | `await` hoặc `return` |
| Mock dùng chung, không reset | test này làm hỏng test kia | `resetAllMocks` trong `beforeEach` |
| Test chỉ kiểm `toHaveBeenCalled()` | xanh với lời gọi sai tham số | `toHaveBeenCalledWith(...)` |
| `toEqual` bỏ qua `undefined` | không phân biệt `{a:1}` và `{a:1,b:undefined}` | `toStrictEqual` khi cần |
| Mock quá nhiều | test chỉ kiểm mock, không kiểm code | chỉ giả thứ ở **ranh giới** (DB, HTTP, giờ) |

## Dùng ở đâu trong `shop-api`
Các spec này chạy bằng `npm test` (Jest, `rootDir: src`). Chúng là lưới an toàn khi B01 đổi repository sang TypeORM và B06 tách lớp: spec của bạn phải vẫn xanh nếu hành vi không đổi. Q02 thêm e2e với DB thật, Q03 test guard/pipe/interceptor riêng lẻ.
