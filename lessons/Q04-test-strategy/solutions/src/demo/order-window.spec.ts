import { isOrderingOpen } from './order-window';

// Mọi mốc thời gian là tức thời tuyệt đối (ISO có offset): kết quả không phụ thuộc múi giờ máy chạy test.
const vn = (iso: string) => new Date(`${iso}+07:00`);

describe('isOrderingOpen (giờ Việt Nam)', () => {
  it('thứ Bảy 17/10/2026 09:00 → mở', () => {
    expect(isOrderingOpen(vn('2026-10-17T09:00:00'))).toBe(true);
  });

  it('biên mở cửa: 07:59 đóng, 08:00 mở', () => {
    expect(isOrderingOpen(vn('2026-10-16T07:59:59'))).toBe(false);
    expect(isOrderingOpen(vn('2026-10-16T08:00:00'))).toBe(true);
  });

  it('biên đóng cửa: 21:59 mở, 22:00 đóng', () => {
    expect(isOrderingOpen(vn('2026-10-16T21:59:59'))).toBe(true);
    expect(isOrderingOpen(vn('2026-10-16T22:00:00'))).toBe(false);
  });

  it('Chủ nhật đóng cả ngày, kể cả giữa trưa', () => {
    expect(isOrderingOpen(vn('2026-10-18T12:00:00'))).toBe(false);
    expect(isOrderingOpen(vn('2026-10-18T08:00:00'))).toBe(false);
  });

  it('thứ Hai mở (sau Chủ nhật), thứ Bảy 21:30 vẫn mở', () => {
    expect(isOrderingOpen(vn('2026-10-19T08:00:00'))).toBe(true);
    expect(isOrderingOpen(vn('2026-10-17T21:30:00'))).toBe(true);
  });

  it('múi giờ: 02:00 UTC thứ Bảy = 09:00 giờ VN (mở); 17:00 UTC thứ Bảy = 00:00 Chủ nhật VN (đóng)', () => {
    expect(isOrderingOpen(new Date('2026-10-17T02:00:00Z'))).toBe(true);
    expect(isOrderingOpen(new Date('2026-10-17T17:00:00Z'))).toBe(false);
  });

  it('cùng một tức thời cho cùng kết quả dù biểu diễn bằng offset khác', () => {
    expect(isOrderingOpen(new Date('2026-10-17T09:00:00+07:00'))).toBe(isOrderingOpen(new Date('2026-10-17T02:00:00Z')));
    expect(isOrderingOpen(new Date('2026-10-16T19:00:00-07:00'))).toBe(true); // 09:00 thứ Bảy VN
  });

  it('đồng hồ hệ thống giả: dùng fake timers thay vì new Date() thật', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-17T02:00:00Z'));
    try {
      expect(isOrderingOpen(new Date())).toBe(true);
      jest.setSystemTime(new Date('2026-10-17T18:00:00Z'));
      expect(isOrderingOpen(new Date())).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });
});
