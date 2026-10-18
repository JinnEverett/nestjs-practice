import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thêm `products.weight_grams integer NOT NULL` vào bảng ĐANG CÓ DỮ LIỆU.
 * - `ADD COLUMN ... NOT NULL` KHÔNG kèm DEFAULT sẽ lỗi (23502) ngay khi bảng có dòng. Có DEFAULT hằng số thì Postgres ≥ 11 chỉ ghi vào catalog,
 *   không viết lại bảng, nên an toàn cả với bảng hàng triệu dòng.
 * - CHECK thêm bằng `NOT VALID` rồi `VALIDATE CONSTRAINT`: bước đầu chỉ cần khóa ngắn, bước sau quét bảng mà vẫn cho đọc/ghi.
 */
export class AddProductWeight1760000000002 implements MigrationInterface {
  name = 'AddProductWeight1760000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD "weight_grams" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "ck_products_weight" CHECK ("weight_grams" >= 0) NOT VALID`);
    await queryRunner.query(`ALTER TABLE "products" VALIDATE CONSTRAINT "ck_products_weight"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "ck_products_weight"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "weight_grams"`);
  }
}
