import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { ProductNotFoundError, TagNotFoundError } from '../common/errors/domain-errors';
import { ProductEntity } from '../database/entities/product.orm-entity';
import { TagEntity } from '../database/entities/tag.orm-entity';
import { ProductTagsView, TagCountView } from './dto/tags.dto';

@Injectable()
export class TagsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  /**
   * Thay toàn bộ tập nhãn của sản phẩm. Trong MỘT transaction để không có trạng thái nửa vời.
   * Tạo nhãn mới bằng `INSERT ... ON CONFLICT DO NOTHING` (orIgnore): hai request cùng tạo nhãn "sale" không đụng nhau (không "kiểm tra rồi chèn").
   */
  async setProductTags(productId: number, names: readonly string[]): Promise<ProductTagsView> {
    return this.ds.transaction(async (m) => {
      // Khóa dòng sản phẩm (SELECT ... FOR UPDATE) TRƯỚC: các PUT đồng thời trên cùng một sản phẩm xếp hàng nhau, nếu không hai transaction
      // cùng tính 'cần thêm (product, tag)' rồi cùng chèn và đụng khóa chính của bảng nối. Khóa không dùng được cùng JOIN, nên tải quan hệ ở bước sau.
      const product = await m.findOne(ProductEntity, { where: { id: productId }, lock: { mode: 'pessimistic_write' } });
      if (!product) throw new ProductNotFoundError(productId);
      if (names.length > 0) await m.createQueryBuilder().insert().into(TagEntity).values(names.map((name) => ({ name }))).orIgnore().execute();
      product.tags = names.length > 0 ? await m.find(TagEntity, { where: { name: In([...names]) } }) : [];
      await m.save(ProductEntity, product); // TypeORM so sánh với tập cũ rồi chỉ INSERT/DELETE các dòng product_tags chênh lệch
      return { productId, tags: product.tags.map((t) => t.name).sort() };
    });
  }

  /** Tên nhãn + số sản phẩm: MỘT truy vấn (LEFT JOIN + GROUP BY), nhãn chưa gắn sản phẩm nào có productCount 0. */
  async list(): Promise<TagCountView[]> {
    const rows: { name: string; count: string }[] = await this.ds
      .createQueryBuilder()
      .select('t.name', 'name')
      .addSelect('COUNT(pt.product_id)', 'count')
      .from(TagEntity, 't')
      .leftJoin('product_tags', 'pt', 'pt.tag_id = t.id')
      .groupBy('t.id')
      .orderBy('t.name', 'ASC')
      .getRawMany();
    return rows.map((r) => ({ name: r.name, productCount: Number(r.count) })); // COUNT trả bigint → chuỗi
  }

  async productsOf(name: string): Promise<{ id: number; sku: string; name: string; price: number }[]> {
    const tag = await this.ds.getRepository(TagEntity).findOne({ where: { name }, relations: { products: true } });
    if (!tag) throw new TagNotFoundError(name);
    return (tag.products ?? []).sort((a, b) => a.id - b.id).map((p) => ({ id: p.id, sku: p.sku, name: p.name, price: p.price }));
  }
}
