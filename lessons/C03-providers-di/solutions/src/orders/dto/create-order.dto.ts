export class CreateOrderItemDto {
  productId!: number;
  quantity!: number;
}

export class CreateOrderDto {
  items!: CreateOrderItemDto[];
  discountCode?: string | null;
}
