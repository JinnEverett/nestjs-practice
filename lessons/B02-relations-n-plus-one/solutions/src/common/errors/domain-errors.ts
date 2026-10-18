/**
 * Lỗi nghiệp vụ: không biết gì về HTTP. Service ném chúng; filter (tầng biên) quyết định status và type.
 * Nhờ vậy cùng một service dùng được từ queue/CLI/GraphQL mà không kéo theo HttpException.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  /** Thành phần mở rộng của problem details (RFC 9457 "extension members"). */
  readonly extensions: Record<string, unknown> = {};

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ProductNotFoundError extends DomainError {
  readonly code = 'product-not-found';
  constructor(readonly productId: number) {
    super(`Không có sản phẩm #${productId}`);
    this.extensions.productId = productId;
  }
}

export class OutOfStockError extends DomainError {
  readonly code = 'out-of-stock';
  constructor(
    readonly productId: number,
    readonly requested: number,
    readonly available: number,
  ) {
    super(`Sản phẩm #${productId} không đủ tồn kho (cần ${requested}, còn ${available})`);
    Object.assign(this.extensions, { productId, requested, available });
  }
}

export class CategoryNotFoundError extends DomainError {
  readonly code = 'category-not-found';
  constructor(readonly categoryId: number) {
    super(`Không có danh mục #${categoryId}`);
    this.extensions.categoryId = categoryId;
  }
}

export class InvalidCategoryError extends DomainError {
  readonly code = 'invalid-category';
  constructor(readonly categoryId: number) {
    super(`Danh mục #${categoryId} không tồn tại`);
    this.extensions.categoryId = categoryId;
  }
}

export class CategoryInUseError extends DomainError {
  readonly code = 'category-in-use';
  constructor(
    readonly categoryId: number,
    reason: string,
  ) {
    super(`Danh mục #${categoryId} không xóa được: ${reason}`);
    this.extensions.categoryId = categoryId;
  }
}

export class DuplicateSlugError extends DomainError {
  readonly code = 'duplicate-slug';
  constructor(readonly slug: string) {
    super(`Slug "${slug}" đã tồn tại`);
    this.extensions.slug = slug;
  }
}

export class TagNotFoundError extends DomainError {
  readonly code = 'tag-not-found';
  constructor(readonly tag: string) {
    super(`Không có nhãn "${tag}"`);
    this.extensions.tag = tag;
  }
}

export class DuplicateSkuError extends DomainError {
  readonly code = 'duplicate-sku';
  constructor(readonly sku: string) {
    super(`SKU ${sku} đã tồn tại`);
    this.extensions.sku = sku;
  }
}
