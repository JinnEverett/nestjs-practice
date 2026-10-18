import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Đổi tên cột `users.full_name` thành `display_name` BẰNG `RENAME COLUMN` (giữ nguyên dữ liệu, chỉ đổi catalog).
 * Cách sai hay gặp (và là thứ `migration:generate` tự sinh khi bạn đổi tên thuộc tính): `DROP COLUMN full_name` rồi `ADD COLUMN display_name`,
 * mất sạch dữ liệu. Ở production có nhiều bản ứng dụng chạy lẫn nhau lúc deploy thì đổi tên thẳng sẽ làm bản cũ lỗi: dùng expand/contract
 * (thêm cột mới, ghi cả hai, chuyển dần, rồi bỏ cột cũ) qua nhiều lần deploy. Ở đây `users` chưa có API nào dùng cột này nên đổi thẳng được.
 */
export class RenameUserFullName1760000000004 implements MigrationInterface {
  name = 'RenameUserFullName1760000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "full_name" TO "display_name"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "display_name" TO "full_name"`);
  }
}
