import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';

export const lazyCounters = { constructed: 0 };

@Injectable()
export class ReportsService {
  constructor(private readonly products: ProductsService) {
    lazyCounters.constructed++;
  }

  async summary(): Promise<{ productCount: number }> {
    return { productCount: await this.products.count() };
  }
}
