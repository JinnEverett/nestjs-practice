// @ts-nocheck — bản tham chiếu để sinh mutant; không import trực tiếp.
/** Giờ nhận đặt hàng: thứ Hai–thứ Bảy, 08:00 (gồm) đến 22:00 (không gồm), theo GIỜ VIỆT NAM bất kể máy chủ ở múi giờ nào. */
const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function isOrderingOpen(now: Date): boolean {
  const parts = Object.fromEntries(formatter.formatToParts(now).map((p) => [p.type, p.value]));
  if (parts.weekday === 'Sun') return false;
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return minutes >= 8 * 60 && minutes < 22 * 60;
}
