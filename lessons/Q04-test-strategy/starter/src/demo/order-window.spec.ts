import { isOrderingOpen } from './order-window';

// Spec này xanh trên máy của tác giả (múi giờ Việt Nam) nhưng đỏ ở CI, và thỉnh thoảng đỏ vào ban đêm. Hãy sửa (ex05).
let calls = 0;

describe('isOrderingOpen', () => {
  it('mở cửa lúc 9h sáng thứ Bảy', () => {
    calls++;
    expect(isOrderingOpen(new Date(2026, 9, 17, 9, 0))).toBe(true);
  });

  it('đóng cửa Chủ nhật', () => {
    calls++;
    expect(isOrderingOpen(new Date(2026, 9, 18, 12, 0))).toBe(false);
  });

  it('đóng cửa đúng 22h', () => {
    calls++;
    expect(isOrderingOpen(new Date(2026, 9, 16, 22, 0))).toBe(false);
  });

  it('lúc này: mở nếu đang trong giờ làm việc', () => {
    const now = new Date();
    expect(isOrderingOpen(now)).toBe(now.getDay() !== 0 && now.getHours() >= 8 && now.getHours() < 22);
  });

  it('đã gọi đúng 3 lần ở các test trước', () => {
    expect(calls).toBe(3);
  });
});
