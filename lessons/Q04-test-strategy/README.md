# Q04 · Chiến lược test: kim tự tháp, TDD, flaky, coverage

Đọc khoảng 10 phút. Q01–Q03 dạy *cách* viết test. Module này trả lời *viết cái gì, ở tầng nào, bao nhiêu*, và vì sao hai bộ test cùng "coverage 90%" có thể chênh nhau một trời một vực.

## Mục tiêu
- Chọn đúng tầng (unit / component / e2e / không test) cho từng tình huống, với lý do chi phí–giá trị.
- Làm TDD một tính năng nhỏ theo vòng Red → Green → Refactor.
- Chẩn đoán và sửa test **flaky** (múi giờ, đồng hồ thật, trạng thái dùng chung, thứ tự chạy).
- Đọc coverage đúng nghĩa; dùng mutation (như bộ chấm của Q01/Q03) làm thước đo "test có nghĩa".

## 1. Kim tự tháp
```
        /\          e2e (HTTP + AppModule + DB): ít, chậm, bắt lỗi LẮP GHÉP
       /  \         component (guard, pipe, interceptor, filter): vừa, nhanh
      /____\        unit (hàm thuần, service với mock): nhiều, mili-giây
```
Tỉ lệ gợi ý ~70/20/10 theo số lượng, nhưng thứ cần giữ là **chi phí mỗi tín hiệu**: một lỗi làm tròn nên bị bắt ở unit (0,05 s, chỉ đúng chỗ hỏng), không phải ở e2e (0,5 s và 12 file có thể sai). Ngược lại, thứ tự `guard → pipe` hay cấu hình `ValidationPipe` chỉ lộ ra khi có đường HTTP thật, unit test không thấy được.

**Tiêu chí chọn tầng**
| Đặc điểm | Tầng |
|---|---|
| Logic thuần, nhiều nhánh/biên, không I/O | unit |
| Thành phần Nest có logic riêng, cần `ExecutionContext`/thời gian giả | component |
| Hành vi chỉ tồn tại khi các phần lắp với nhau (thứ tự lifecycle, phân quyền route, định dạng lỗi HTTP, một luồng nghiệp vụ nhiều bước) | e2e |
| Không có logic để hỏng (getter, thông điệp chữ, cấu hình khai báo) | **không test** |

Test cũng là mã phải bảo trì. Thêm một test chỉ đáng khi giá trị nó mang lại (bắt lỗi thật) lớn hơn chi phí (viết, chạy, sửa khi refactor). "Không test" là một lựa chọn hợp lệ.

## 2. TDD
```
Red       : viết MỘT test nhỏ cho hành vi mới, chạy, thấy nó ĐỎ vì đúng lý do
Green     : viết mã ít nhất cho test xanh (kể cả "ngu nhất")
Refactor  : dọn mã và test khi đang xanh; chạy lại
```
Giá trị không nằm ở "có test" mà ở chỗ test đỏ-trước **chứng minh test có thể đỏ**, và buộc bạn nghĩ *hợp đồng* (đầu vào, đầu ra, lỗi) trước khi nghĩ cách cài. Hợp với logic có quy tắc rõ (giá, biên, sắp xếp); kém hơn với khám phá giao diện/hạ tầng chưa rõ hình dạng. Bước nhỏ: mỗi vòng thêm một hành vi.

## 3. Coverage nói gì và không nói gì
Coverage đo dòng/nhánh **đã chạy**, không đo hành vi **đã kiểm**. Spec gọi hàm rồi `expect(true).toBe(true)` cho 100%. Dùng coverage để tìm *chỗ chưa ai chạy tới* (ngưỡng thấp là tín hiệu), không để kết luận chỗ đã chạy là an toàn. Thước đo tốt hơn là **mutation**: sửa nhẹ mã (đổi `>=` thành `>`, bỏ một `if`), nếu test vẫn xanh thì test không bảo vệ gì ở đó.

## 4. Test flaky
Test "lúc xanh lúc đỏ" làm mọi người ngừng tin CI. Nguyên nhân hay gặp:
| Nguyên nhân | Dấu hiệu | Cách sửa |
|---|---|---|
| Múi giờ máy chạy | xanh ở máy dev (UTC+7), đỏ ở CI (UTC) | dùng tức thời tuyệt đối (`'...+07:00'`, `'...Z'`), không `new Date(năm, tháng, ...)` hay `getHours()` |
| Đồng hồ thật | đỏ lúc nửa đêm, cuối tháng, năm nhuận | tiêm đồng hồ (`ClockService`) hoặc `jest.useFakeTimers().setSystemTime(...)` |
| Trạng thái dùng chung giữa test | đỏ khi chạy riêng/ngẫu nhiên thứ tự | mỗi test tự dựng dữ liệu; `--randomize` để phát hiện |
| `sleep` chờ điều kiện | đỏ khi máy chậm | chờ điều kiện thật hoặc fake timers |
| Ngẫu nhiên (`Math.random`) | đỏ 1/100 lần | tiêm nguồn ngẫu nhiên hoặc cố định seed |
| Dữ liệu e2e dùng chung/ID cố định | đỏ khi chạy song song | dữ liệu riêng mỗi test (Q02) |

Quy trình: tái hiện ổn định (chạy 50 lần, đổi `TZ`, `--randomize`), tìm nguồn không xác định, **loại nó khỏi test** (không thêm retry che lỗi), rồi kiểm tra test vẫn bắt được lỗi thật (mutation).

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| Đuổi theo con số coverage | test "chạy qua" không kiểm gì | mutation, review assertion |
| Mọi thứ đều e2e | bộ test chậm, mong manh | đẩy xuống unit/component khi có thể |
| Mọi thứ đều unit với mock | lỗi lắp ghép lọt | giữ vài e2e cho luồng chính và cắt ngang |
| Retry test flaky cho "xanh" | che lỗi thật, ngày càng nhiều flaky | tìm nguyên nhân gốc |
| TDD cho thứ chưa biết hình dạng | viết lại test liên tục | spike (khám phá) trước, TDD sau |
| Test kiểm chi tiết cài đặt | sửa cấu trúc là vỡ cả loạt | kiểm hành vi quan sát được |
| Không bao giờ xóa test | bộ test phình, lỗi thời | xóa test trùng/không còn giá trị |

## Dùng ở đâu trong `shop-api`
Từ B01 mỗi tính năng có ngân sách tầng: logic giá/biên ở unit, mapping lỗi ở component, vài e2e cho đường chính và 401/403/400. R08 (race condition) cần e2e đồng thời vì unit không thấy; CAP đòi `npm test` chạy được trong CI với thời gian có ngân sách và không flaky.
