# C03 · Bài tập

Code trong `shop-api/`. Chấm: `bash lessons/check.sh lessons/C03-providers-di NN|all`. Tiếp tục từ `shop-api` sau C02 (đủ 7/8 bài C02 trở lên).

Quy ước (xem `CONTRACT.md` mục 3): tiền là số nguyên VND; giá lấy từ sản phẩm **tại thời điểm đặt**; phí ship `30000`, miễn khi tiền hàng `>= 500000` (tính **trước** giảm giá); mã `WELCOME10` (−10% tiền hàng, tối đa 100000, đơn tối thiểu 200000), `FREESHIP` (miễn phí ship, không giảm tiền hàng, không đơn tối thiểu). Mỗi đơn dùng tối đa một mã; mã không phân biệt hoa thường và được `trim`.

**Pass:** 7/8 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Repository qua injection token
- `src/products/products.repository.ts` export `PRODUCTS_REPOSITORY` (một `Symbol`) và `interface ProductsRepository`:
  ```ts
  findAll(): Promise<Product[]>;
  findById(id: number): Promise<Product | undefined>;
  findBySku(sku: string): Promise<Product | undefined>;
  insert(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product>;
  update(id: number, patch: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | undefined>;
  delete(id: number): Promise<boolean>;
  ```
- `InMemoryProductsRepository` (`@Injectable`) cài đặt nó; `ProductsModule` đăng ký `{ provide: PRODUCTS_REPOSITORY, useClass: InMemoryProductsRepository }`.
- `ProductsService` **chỉ** nói chuyện với dữ liệu qua token này (không giữ `Map` riêng) và trở thành `async`. Mọi hành vi của C02 giữ nguyên.
- Bộ chấm thay `PRODUCTS_REPOSITORY` bằng bản giả chỉ có vài method và kiểm service gọi đúng chúng.

### ex02 · `PricingService`
- `src/pricing/pricing.service.ts` (`@Injectable`) export `PricingService` với `quote(lines: { unitPrice: number; quantity: number }[], discountCode?: string | null): { subtotal: number; shippingFee: number; discountAmount: number; totalAmount: number }`.
- `totalAmount = subtotal + shippingFee − discountAmount`. Mọi số là số nguyên (làm tròn **xuống**).
- Lỗi (ném exception của Nest): `lines` rỗng, `quantity` không phải số nguyên `>= 1`, `unitPrice` không phải số nguyên `>= 0` → `BadRequestException`. Mã lạ, hoặc tiền hàng chưa đủ tối thiểu của mã → `UnprocessableEntityException`. `null`/chuỗi rỗng = không dùng mã.
- Đăng ký trong `src/pricing/pricing.module.ts` (`PricingModule`, export `PricingService`) và đưa vào `AppModule`.

---

## 🟡 Kết hợp

### ex03 · `useValue`: quy tắc giá là cấu hình, không phải hằng số chìm
- `src/pricing/pricing.rules.ts` export `PRICING_RULES` (Symbol), `interface PricingRules` và `DEFAULT_PRICING_RULES`:
  ```ts
  interface PricingRules {
    shippingFee: number;
    freeShippingThreshold: number;
    codes: Record<string, { type: 'percent'; percent: number; maxDiscount: number; minSubtotal: number }
                        | { type: 'freeship'; minSubtotal?: number }>;
  }
  ```
- `PricingService` nhận rules qua `@Inject(PRICING_RULES)`; `PricingModule` cung cấp bằng `useValue: DEFAULT_PRICING_RULES`. Không còn con số 30000/500000/WELCOME10 trong `PricingService`.
- Bộ chấm override `PRICING_RULES` bằng bộ quy tắc khác (khóa mã bất kỳ, như `TET`) và kiểm tổng tiền đơn hàng đổi theo.

### ex04 · Đặt hàng in-memory
`src/orders/` gồm `orders.module.ts` (`OrdersModule`), `orders.controller.ts`, `orders.service.ts` (export `OrdersService`). Đăng ký `OrdersModule` trong `AppModule`.
- `POST /v1/orders` body `{ items: [{ productId, quantity }], discountCode?: string | null }`.
  - `201` + `Location: /v1/orders/<id>` + `{ id, userId, status, items: [{ productId, quantity, unitPrice }], shippingFee, discountCode, discountAmount, totalAmount, createdAt, updatedAt }`.
  - `userId` luôn là `1` (chưa có xác thực, A02 sẽ thay), `status = 'pending'`, `discountCode` là mã đã chuẩn hóa hoặc `null`, `updatedAt = createdAt`.
  - `unitPrice` lấy từ sản phẩm; bỏ qua mọi `unitPrice`, `totalAmount`, `userId` client gửi.
  - Các dòng cùng `productId` được **gộp** (cộng `quantity`); kiểm tồn kho theo tổng.
  - Đặt thành công thì **trừ tồn kho**.
  - Lỗi: body/`items`/`productId`/`quantity` sai kiểu hoặc rỗng → `400`; sản phẩm không tồn tại hoặc `isActive=false` → `422`; không đủ tồn kho → `409`; lỗi mã giảm giá → `422`.
- `GET /v1/orders/:id` → `200` | `404` | `400` (id không phải số).
- `OrdersService` dùng `PricingService` và `ProductsService` (import `ProductsModule`; export `ProductsService` từ module đó).

### ex05 · `useFactory`, `useExisting`, `@Optional`
Tất cả trong `src/orders/orders.tokens.ts` (export 3 Symbol) và `OrdersModule`:
- `NOW`: `useFactory` + `inject: [ClockService]` tạo hàm `() => Date`. `createdAt`/`updatedAt` của đơn lấy từ `NOW()`. Bộ chấm thay `ClockService` bằng bản có giờ cố định.
- `ORDER_READER`: `useExisting: OrdersService` (cùng instance; `OrdersService` có `findById(id): Order`).
- `ORDER_NOTIFIER`: `OrdersService` nhận `@Optional() @Inject(ORDER_NOTIFIER) notifier?: { orderCreated(order: Order): void | Promise<void> }`. **Không đăng ký provider này ở đâu cả** trong ứng dụng; app chạy bình thường. Nếu ai đó cung cấp nó (bộ chấm làm vậy bằng module global), nó được gọi **đúng một lần** sau khi đơn tạo xong với bản sao của đơn. Nếu nó ném lỗi/reject thì đơn **vẫn** thành công (`201`) và vẫn giữ trong hệ thống.

### ex06 · Vòng phụ thuộc
- `DELETE /v1/products/:id`: sản phẩm đã nằm trong ít nhất một đơn → `409`; chưa từng → `204`; không có → `404`.
- Muốn biết điều đó `ProductsService` phải hỏi `OrdersService` (vd. `hasOrdersFor(productId)`), trong khi `OrdersService` đã cần `ProductsService` → vòng. Giải bằng `forwardRef` ở cả provider lẫn module. (Bạn được giải theo cách khác miễn app khởi động được và hành vi đúng; nhưng hãy thử `forwardRef` một lần để thấy lỗi gốc.)

---

## 🔴 Thực tế

### ex07 · "Đơn bị từ chối nhưng kho đã bị trừ"
Kho báo: khách đặt 2 món, món thứ hai hết hàng, hệ thống trả lỗi nhưng món thứ nhất đã bị trừ tồn kho; vài giờ sau "hết hàng ảo".
- Đơn bị từ chối vì **bất kỳ** lý do nào (hết hàng, sản phẩm không có hoặc ngừng bán ở dòng sau, mã giảm giá sai) thì **không** có tồn kho nào thay đổi.
- Đặt vừa đúng bằng tồn kho thì được; đặt thêm 1 → `409`.

### ex08 · "Đơn lệch 1 đồng và giá nhảy"
Kế toán báo đối soát lệch 1 đồng với một số đơn dùng `WELCOME10`; CSKH báo đơn cũ đổi tổng tiền sau khi marketing sửa giá sản phẩm.
- Giá trong đơn là **ảnh chụp** lúc đặt: đổi giá sản phẩm sau đó không ảnh hưởng đơn cũ, đơn mới dùng giá mới.
- Subtotal `333335` + `WELCOME10` → giảm `33333` (làm tròn xuống), tổng `330002`.
- Ngưỡng miễn ship tính trên tiền hàng **trước** giảm giá (subtotal `520000` + `WELCOME10` → ship `0`, giảm `52000`, tổng `468000`).
- Mọi số tiền trong đơn là số nguyên và `totalAmount = Σ(unitPrice × quantity) + shippingFee − discountAmount`.
- Response của GET là dữ liệu **ổn định**, không phải tham chiếu đến object đang lưu: sửa thứ gì đó sau khi nhận không làm đổi lần đọc sau.

---

> 📏 Câu hỏi (không chấm): `OrdersService.create` có `await` giữa lúc kiểm tồn kho và lúc trừ. Với repository **in-memory** hai request đồng thời không chen nhau được (vì sao? gợi ý: microtask vs macrotask, N01). Khi đổi sang Postgres ở B01, điều gì xảy ra với "kiểm rồi mới trừ" khi 100 request cùng mua 1 món còn tồn 1? Viết dự đoán 3 dòng; B05 và R08 sẽ kiểm chứng.
