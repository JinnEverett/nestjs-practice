import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thay index `idx_orders_user (user_id)` bằng index ghép `idx_orders_user_created (user_id, created_at)` mà KHÔNG chặn ghi.
 * `CREATE INDEX CONCURRENTLY` không chạy được trong transaction, nên migration này đặt `transaction = false`:
 * TypeORM không bọc nó trong BEGIN/COMMIT. Đổi lại, nếu nửa chừng lỗi thì KHÔNG tự rollback; `IF NOT EXISTS`/`IF EXISTS` để chạy lại được.
 * Tạo index mới TRƯỚC khi bỏ index cũ để không có khoảng thời gian trống mà truy vấn theo user_id không có index.
 *
 * LƯU Ý BẤT ĐỐI XỨNG của TypeORM: `transaction = false` chỉ có tác dụng khi CHẠY LÊN. Khi LÙI, `migration:revert` luôn bọc trong transaction
 * (trừ khi chế độ là `none`), nên down() có CONCURRENTLY phải lùi bằng `npm run migration:revert -- -t none`.
 */
export class OrdersUserCreatedIndex1760000000003 implements MigrationInterface {
  name = 'OrdersUserCreatedIndex1760000000003';
  transaction = false as const;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_orders_user_created" ON "orders" ("user_id", "created_at")`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "public"."idx_orders_user"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_orders_user" ON "orders" ("user_id")`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "public"."idx_orders_user_created"`);
  }
}
