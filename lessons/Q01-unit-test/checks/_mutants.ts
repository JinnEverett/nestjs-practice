import { Mutant } from './_mutation';

export const PRICING_MUTANTS: Mutant[] = [
  { name: 'ngưỡng miễn ship: >= thành >', edits: [['subtotal >= this.rules.freeShippingThreshold', 'subtotal > this.rules.freeShippingThreshold']] },
  { name: 'giảm giá làm tròn lên/gần nhất thay vì xuống', edits: [['Math.min(Math.floor(', 'Math.min(Math.round(']] },
  { name: 'giảm giá không bị chặn ở mức tối đa', edits: [['Math.min(Math.floor((subtotal * rule.percent) / 100), rule.maxDiscount)', 'Math.floor((subtotal * rule.percent) / 100)']] },
  { name: 'đơn tối thiểu của mã: < thành <=', edits: [['subtotal < (rule.minSubtotal ?? 0)', 'subtotal <= (rule.minSubtotal ?? 0)']] },
  { name: 'FREESHIP không bỏ phí ship', edits: [["if (rule.type === 'freeship') shippingFee = 0;", "if (rule.type === 'freeship') shippingFee = shippingFee;"]] },
  { name: 'mã "constructor" lọt qua bảng mã', edits: [['Object.hasOwn(this.rules.codes, code)', 'code in this.rules.codes']] },
  { name: 'mã không được đổi sang chữ hoa', edits: [['discountCode.trim().toUpperCase()', 'discountCode.trim()']] },
  { name: 'tổng tiền cộng giảm giá thay vì trừ', edits: [['subtotal + shippingFee - discountAmount }', 'subtotal + shippingFee + discountAmount }']] },
  { name: 'quantity = 0 được chấp nhận', edits: [['quantity < 1)', 'quantity < 0)']] },
];

export const PRODUCTS_MUTANTS: Mutant[] = [
  { name: 'SKU không đổi sang chữ hoa', edits: [['const sku = raw.trim().toUpperCase();', 'const sku = raw.trim();']] },
  { name: 'tạo trùng SKU không bị chặn', edits: [['if (await this.repo.findBySku(sku)) throw', 'if (false) throw']] },
  { name: 'giữ nguyên SKU của chính nó bị báo trùng', edits: [['if (other && other.id !== id) throw', 'if (other) throw']] },
  { name: 'xóa sản phẩm đã có đơn vẫn được', edits: [['if (this.orders.hasOrdersFor(id)) throw', 'if (false) throw']] },
  { name: 'hòa giá không phân xử bằng id', edits: [['return (desc ? -cmp : cmp) || a.id - b.id;', 'return desc ? -cmp : cmp;']] },
  { name: 'maxPrice=0 bị coi là không lọc', edits: [['query.maxPrice === undefined ||', '!query.maxPrice ||']] },
  { name: 'name không được trim', edits: [['name: dto.name.trim(),', 'name: dto.name,']] },
  { name: 'giá 0 bị từ chối', edits: [['price < 0)', 'price <= 0)']] },
  { name: 'brand lọc phân biệt hoa thường', edits: [['p.brand?.toLowerCase() === brand', 'p.brand === query.brand']] },
];

export const ORDERS_MUTANTS: Mutant[] = [
  { name: 'dòng trùng sản phẩm không được cộng dồn', edits: [['merged.set(productId, (merged.get(productId) ?? 0) + quantity);', 'merged.set(productId, quantity);']] },
  { name: 'tồn kho: < thành <=', edits: [['product.stock < quantity', 'product.stock <= quantity']] },
  { name: 'sản phẩm ngừng bán vẫn bán được', edits: [['if (!product.isActive) throw', 'if (false) throw']] },
  {
    name: 'trừ kho ngay trong lúc kiểm tra (không nguyên tử)',
    edits: [
      ['lines.push({ productId, quantity, unitPrice: product.price });', 'lines.push({ productId, quantity, unitPrice: product.price });\n      await this.products.adjustStock(productId, -quantity);'],
      ['for (const l of lines) await this.products.adjustStock(l.productId, -l.quantity);', ''],
    ],
  },
  { name: 'unitPrice không lấy từ sản phẩm', edits: [['unitPrice: product.price }', 'unitPrice: 0 }']] },
  { name: 'lỗi của notifier làm hỏng đơn', edits: [['} catch (err) {\n      // Thông báo', '} catch (err) {\n      throw err;\n      // Thông báo']] },
  { name: 'mã giảm giá không chuẩn hóa', edits: [['dto.discountCode.trim().toUpperCase()', 'dto.discountCode.trim()']] },
  { name: 'createdAt không dùng NOW', edits: [['const at = this.now().toISOString();', 'const at = new Date().toISOString();']] },
  { name: 'findById trả tham chiếu nội bộ', edits: [['return structuredClone(o);', 'return o;']] },
  { name: 'notifier không bao giờ được gọi', edits: [['await this.notifier?.orderCreated(structuredClone(order));', 'void 0;']] },
];

export const ORDERS_CONTROLLER_MUTANTS: Mutant[] = [
  { name: 'Location sai đường dẫn', edits: [['res.location(`/v1/orders/${order.id}`)', 'res.location(`/orders/${order.id}`)']] },
  { name: 'không đặt Location', edits: [['res.location(`/v1/orders/${order.id}`);', '']] },
  { name: 'trả về không phải đơn vừa tạo', edits: [['    return order;\n  }\n\n  @Get', '    return { id: order.id };\n  }\n\n  @Get']] },
  { name: 'findOne không chuyển id cho service', edits: [['return this.orders.findById(id);', 'return this.orders.findById(1);']] },
];
