import { BadRequestException, Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PRICING_RULES, type PricingRules } from './pricing.rules';

export interface PriceLine {
  unitPrice: number;
  quantity: number;
}

export interface Quote {
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
}

@Injectable()
export class PricingService {
  constructor(@Inject(PRICING_RULES) private readonly rules: PricingRules) {}

  quote(lines: PriceLine[], discountCode?: string | null): Quote {
    if (lines.length === 0) throw new BadRequestException('Đơn hàng phải có ít nhất một dòng');
    let subtotal = 0;
    for (const { unitPrice, quantity } of lines) {
      if (!Number.isInteger(quantity) || quantity < 1) throw new BadRequestException('quantity phải là số nguyên >= 1');
      if (!Number.isInteger(unitPrice) || unitPrice < 0) throw new BadRequestException('unitPrice phải là số nguyên >= 0');
      subtotal += unitPrice * quantity;
    }

    let shippingFee = subtotal >= this.rules.freeShippingThreshold ? 0 : this.rules.shippingFee;
    let discountAmount = 0;

    if (discountCode !== undefined && discountCode !== null && discountCode.trim() !== '') {
      const code = discountCode.trim().toUpperCase();
      const rule = Object.hasOwn(this.rules.codes, code) ? this.rules.codes[code] : undefined;
      if (!rule) throw new UnprocessableEntityException(`Mã giảm giá ${code} không hợp lệ`);
      if (subtotal < (rule.minSubtotal ?? 0)) {
        throw new UnprocessableEntityException(`Mã ${code} chỉ áp dụng cho đơn từ ${rule.minSubtotal}`);
      }
      if (rule.type === 'freeship') shippingFee = 0;
      // Toán nguyên: subtotal * percent / 100 rồi floor, tránh sai số của số thực (subtotal * 0.1).
      else discountAmount = Math.min(Math.floor((subtotal * rule.percent) / 100), rule.maxDiscount);
    }
    return { subtotal, shippingFee, discountAmount, totalAmount: subtotal + shippingFee - discountAmount };
  }
}
