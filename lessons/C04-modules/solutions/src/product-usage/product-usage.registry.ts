import { Injectable } from '@nestjs/common';

/**
 * Sổ ghi "sản phẩm nào đã nằm trong đơn". Là module thứ ba để Products và Orders
 * không phải import lẫn nhau (gỡ vòng phụ thuộc bằng cách tách ra, thay vì trì hoãn tra token).
 */
@Injectable()
export class ProductUsageRegistry {
  private readonly used = new Set<number>();

  markUsed(productIds: Iterable<number>): void {
    for (const id of productIds) this.used.add(id);
  }

  isUsed(productId: number): boolean {
    return this.used.has(productId);
  }
}
