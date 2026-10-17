# C04 · Bài tập

Tiếp tục `shop-api` sau C03 (và Q01). Chấm: `bash lessons/check.sh lessons/C04-modules NN|all`. Bài kiểm bằng cách dựng các module thử ngay trong test, nên tên file/export dưới đây phải đúng.

> Các spec Q01 của bạn có thể gãy khi bạn đổi constructor của service; cập nhật chúng cho khớp là một phần của bài (refactor có lưới an toàn).

**Pass:** 6/7 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Chỉ export hợp đồng
- `ProductsModule` export **chỉ** `ProductsService`. `PRODUCTS_REPOSITORY` không inject được từ ngoài module (module khác thử inject sẽ lỗi `can't resolve dependencies`).
- `OrdersModule` export `OrdersService` và `ORDER_READER`.
- Module khác `imports: [ProductsModule]` dùng được `ProductsService`.

### ex02 · Gỡ vòng phụ thuộc, bỏ `forwardRef`
- Không còn `forwardRef` ở bất kỳ đâu trong `src/` (file `*.spec.ts` được miễn).
- Giữ nguyên hành vi: `DELETE /v1/products/:id` → `409` nếu sản phẩm đã nằm trong đơn, `204` nếu chưa, `404` nếu không có.
- Đơn **bị từ chối** (hết hàng, 422...) **không** làm sản phẩm bị coi là đã dùng.
- Gợi ý hướng (không bắt buộc đặt tên): module thứ ba chứa một provider ghi nhớ sản phẩm đã vào đơn; Orders ghi, Products đọc, cả hai import module đó. Đồ thị phụ thuộc: `ProductsModule` **không** import `OrdersModule`.

---

## 🟡 Kết hợp

### ex03 · `PricingModule.forRoot(options)`
- `PricingModuleOptions = Partial<PricingRules>`. `PricingModule.forRoot(options)` trộn **nông** options lên `DEFAULT_PRICING_RULES` (truyền `codes` là thay cả bảng mã).
- `forRoot({})` = mặc định; hai lần `forRoot` với options khác nhau là hai cấu hình độc lập.
- `PRICING_RULES` vẫn là token cung cấp bảng giá cuối cùng (C03 ex03 vẫn override được).
- `AppModule` import `PricingModule.forRoot(...)`.

### ex04 · `forRootAsync` và `ConfigurableModuleBuilder`
Dùng `ConfigurableModuleBuilder` (file `src/pricing/pricing.module-definition.ts` là chỗ hợp lý):
- `forRootAsync({ useFactory })` (kể cả `async`), `forRootAsync({ imports, inject, useFactory })` lấy giá trị từ module khác.
- `forRootAsync({ useClass })` trong đó class có method **`createPricingOptions()`** trả options.
- Kết quả vẫn trộn với mặc định.

### ex05 · `SharedModule` là `@Global`
- `src/shared/shared.module.ts` export `SharedModule` (`@Global()`), cung cấp **và export** `ClockService` (qua `ClockModule`).
- `AppModule` import `SharedModule`; `OrdersModule` không còn `imports: [ClockModule]`.
- Module bất kỳ có `SharedModule` ở gốc inject được `ClockService`; không có `SharedModule` thì không. Chỉ có một instance `ClockService`: override một lần là `createdAt` của đơn đổi theo (C03 ex05).

### ex06 · Tùy chọn `isGlobal`
- `PricingModule.forRoot({ ..., isGlobal: true })` và `forRootAsync({ isGlobal: true, ... })`: module khác dùng `PricingService` mà không `imports`. Không truyền thì **không** global.
- `isGlobal` là tùy chọn của module (extras), **không** lọt vào bảng giá.
- `AppModule` cấu hình `PricingModule` một lần với `isGlobal: true`; `OrdersModule` không import `PricingModule`.

---

## 🔴 Thực tế

### ex07 · "Hai bảng giá"
Sau khi tách module, QA báo: marketing đổi phí ship qua cấu hình nhưng một số đơn vẫn tính 30000; đo lại thấy có hai `PricingService` với hai bảng giá khác nhau (một nơi gọi `PricingModule.forRoot({})` thêm lần nữa, một nơi khác liệt kê `PricingService` trong `providers`).
- Toàn ứng dụng chỉ có **một** `PricingModule` (bộ chấm đếm số module trong container).
- Override `PRICING_RULES` một lần thì **mọi** đường tính tiền (kể cả ngưỡng miễn ship) đổi theo.
- Mặc định của ứng dụng vẫn đúng hợp đồng (30000 / 500000 / `WELCOME10` / `FREESHIP`).
- `ProductsModule` không import `OrdersModule`; `OrdersModule` import `ProductsModule`.

---

> 📏 Câu hỏi (không chấm): `PricingModule.forRoot({ shippingFee: 1 })` ở hai module khác nhau tạo bao nhiêu instance `PricingService`, và `forRoot({ shippingFee: 1 })` ở hai nơi với **cùng** options thì sao (gợi ý: Nest băm metadata của dynamic module thành token)? Viết dự đoán, rồi kiểm bằng cách đếm `container.getModules()` như bộ chấm ex07.
