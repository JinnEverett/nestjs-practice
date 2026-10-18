import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CategoryInUseError, CategoryNotFoundError, DuplicateSlugError, InvalidCategoryError } from '../common/errors/domain-errors';
import { CategoryEntity } from '../database/entities/category.orm-entity';
import { CategoryInclude, CategoryView, CreateCategoryDto } from './dto/category.dto';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503'; // chèn/sửa trỏ tới dòng không có (hoặc xóa khi khóa ngoại là NO ACTION)
const RESTRICT_VIOLATION = '23001'; // xóa dòng còn bị tham chiếu khi khóa ngoại là ON DELETE RESTRICT: mã KHÁC với 23503
const pgCode = (e: unknown): string | undefined => (e instanceof QueryFailedError ? (e.driverError as { code?: string } | undefined)?.code : undefined);

const byId = <T extends { id: number }>(a: T, b: T): number => a.id - b.id;

function toView(e: CategoryEntity, include: readonly CategoryInclude[]): CategoryView {
  const view: CategoryView = { id: e.id, parentId: e.parentId, name: e.name, slug: e.slug };
  // Quan hệ to-many không có thứ tự bảo đảm khi nạp bằng JOIN: luôn sắp lại để response ổn định.
  if (include.includes('children')) view.children = [...(e.children ?? [])].sort(byId).map((c) => toView(c, []));
  if (include.includes('products')) {
    view.products = [...(e.products ?? [])].sort(byId).map((p) => ({ id: p.id, sku: p.sku, name: p.name, price: p.price }));
  }
  return view;
}

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(CategoryEntity) private readonly repo: Repository<CategoryEntity>) {}

  async create(dto: CreateCategoryDto): Promise<CategoryView> {
    const parentId = dto.parentId ?? null;
    try {
      const saved = await this.repo.save(this.repo.create({ name: dto.name, slug: dto.slug, parentId }));
      return toView(saved, []);
    } catch (error) {
      // Cả hai ràng buộc do DB phân xử: không "kiểm tra rồi chèn" (race condition).
      if (pgCode(error) === UNIQUE_VIOLATION) throw new DuplicateSlugError(dto.slug);
      if (pgCode(error) === FOREIGN_KEY_VIOLATION) throw new InvalidCategoryError(parentId ?? 0);
      throw error;
    }
  }

  /**
   * Danh sách có thể kèm `children`/`products`. Dùng `relations`: TypeORM JOIN trong CÙNG truy vấn nên số truy vấn không phụ thuộc số danh mục.
   * Cách ngây thơ (vòng lặp gọi `find` cho từng danh mục) là N+1: 1 truy vấn lấy danh sách + N truy vấn lấy con/sản phẩm.
   */
  async findAll(include: readonly CategoryInclude[]): Promise<CategoryView[]> {
    const rows = await this.repo.find({
      order: { id: 'ASC' },
      relations: { children: include.includes('children'), products: include.includes('products') },
    });
    return rows.map((r) => toView(r, include));
  }

  async findOne(id: number, include: readonly CategoryInclude[]): Promise<CategoryView> {
    const row = await this.repo.findOne({
      where: { id },
      relations: { children: include.includes('children'), products: include.includes('products') },
    });
    if (!row) throw new CategoryNotFoundError(id);
    return toView(row, include);
  }

  async remove(id: number): Promise<void> {
    try {
      const result = await this.repo.delete({ id });
      if (!result.affected) throw new CategoryNotFoundError(id);
    } catch (error) {
      // fk_products_category / fk_categories_parent (RESTRICT): còn sản phẩm hoặc danh mục con thì không xóa.
      if (pgCode(error) === RESTRICT_VIOLATION || pgCode(error) === FOREIGN_KEY_VIOLATION) throw new CategoryInUseError(id, 'còn sản phẩm hoặc danh mục con');
      throw error;
    }
  }
}
