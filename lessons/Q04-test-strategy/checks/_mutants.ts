import { Mutant } from './_mutation';

export const DISCOUNT_MUTANTS: Mutant[] = [
  { name: 'bậc 10%/5% tính > thay vì >= (biên 10 và 50)', edits: [['quantity >= t.minQty', 'quantity > t.minQty']] },
  { name: 'làm tròn gần nhất thay vì xuống', edits: [['Math.floor(', 'Math.round(']] },
  { name: 'không có trần giảm giá', edits: [['Math.min(Math.floor((unitPrice * quantity * tier.percent) / 100), MAX_DISCOUNT)', 'Math.floor((unitPrice * quantity * tier.percent) / 100)']] },
  { name: 'trần là mức tối thiểu thay vì tối đa', edits: [['Math.min(Math.floor((unitPrice * quantity * tier.percent) / 100), MAX_DISCOUNT)', 'Math.max(Math.floor((unitPrice * quantity * tier.percent) / 100), MAX_DISCOUNT)']] },
  { name: 'trần 20000 → 20001', edits: [['MAX_DISCOUNT = 20_000', 'MAX_DISCOUNT = 20_001']] },
  { name: 'bậc 50 chỉ giảm 5%', edits: [['{ minQty: 50, percent: 10 }', '{ minQty: 50, percent: 5 }']] },
  { name: 'thứ tự bậc đảo (50 rơi vào bậc 10)', edits: [['  { minQty: 50, percent: 10 },\n  { minQty: 10, percent: 5 },', '  { minQty: 10, percent: 5 },\n  { minQty: 50, percent: 10 },']] },
  { name: 'quantity 0 được chấp nhận', edits: [['quantity < 1', 'quantity < 0']] },
  { name: 'đơn giá 0 bị từ chối', edits: [['unitPrice < 0', 'unitPrice <= 0']] },
  { name: 'quantity lẻ được chấp nhận', edits: [['!Number.isInteger(quantity) ||', '']] },
];

export const ORDER_WINDOW_MUTANTS: Mutant[] = [
  { name: 'biên mở cửa 08:00 bị loại (> thay >=)', edits: [['minutes >= 8 * 60', 'minutes > 8 * 60']] },
  { name: 'biên đóng cửa 22:00 vẫn mở (<= thay <)', edits: [['minutes < 22 * 60', 'minutes <= 22 * 60']] },
  { name: 'Chủ nhật vẫn mở', edits: [["if (parts.weekday === 'Sun') return false;", '']] },
  { name: 'tính theo UTC thay vì giờ Việt Nam', edits: [["'Asia/Ho_Chi_Minh'", "'UTC'"]] },
  { name: 'mở lúc 07:00', edits: [['8 * 60', '7 * 60']] },
  { name: 'đóng lúc 21:00', edits: [['22 * 60', '21 * 60']] },
  { name: 'thứ Bảy bị đóng thay vì Chủ nhật', edits: [["parts.weekday === 'Sun'", "parts.weekday === 'Sat'"]] },
  { name: 'bỏ qua phút (chỉ xét giờ)', edits: [['Number(parts.hour) * 60 + Number(parts.minute)', 'Number(parts.hour) * 60']] },
];

export const LOW_STOCK_MUTANTS: Mutant[] = [
  { name: 'biên ngưỡng: < thay <=', edits: [['p.stock <= threshold', 'p.stock < threshold']] },
  { name: 'không lọc sản phẩm ngừng bán', edits: [['p.isActive && ', '']] },
  { name: 'sắp xếp nhiều hàng trước', edits: [['a.stock - b.stock', 'b.stock - a.stock']] },
  { name: 'hòa tồn kho không phân xử bằng id', edits: [[' || a.id - b.id', '']] },
  { name: 'trả tham chiếu gốc (không sao chép)', edits: [['\n    .map((p) => ({ ...p }));', ';']] },
  { name: 'ngưỡng 0 bị từ chối', edits: [['threshold < 0', 'threshold <= 0']] },
  { name: 'ngưỡng 1000 bị từ chối', edits: [['threshold > LOW_STOCK_MAX', 'threshold >= LOW_STOCK_MAX']] },
  { name: 'ngưỡng lẻ được chấp nhận', edits: [['!Number.isInteger(threshold) || ', '']] },
  { name: 'mặc định 10 thay vì 5', edits: [['LOW_STOCK_DEFAULT = 5', 'LOW_STOCK_DEFAULT = 10']] },
  {
    name: 'sắp xếp tại chỗ làm đổi mảng đầu vào',
    edits: [
      ['  return products\n    .filter((p) => p.isActive && p.stock <= threshold)\n    .sort((a, b) => a.stock - b.stock || a.id - b.id)', '  return (products as Product[])\n    .sort((a, b) => a.stock - b.stock || a.id - b.id)\n    .filter((p) => p.isActive && p.stock <= threshold)'],
    ],
  },
];
