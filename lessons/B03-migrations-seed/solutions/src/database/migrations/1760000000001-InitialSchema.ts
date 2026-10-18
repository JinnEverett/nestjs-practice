/**
 * Migration khởi tạo, sinh bằng `npm run migration:generate -- src/database/migrations/InitialSchema` trên DB trống
 * (so entity với schema rỗng). Chỉ đổi timestamp thành giá trị cố định để thứ tự dễ đọc.
 * KHÔNG sửa file này sau khi đã chạy ở bất kỳ môi trường nào: đổi schema thì viết migration MỚI.
 */
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1760000000001 implements MigrationInterface {
    name = 'InitialSchema1760000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" SERIAL NOT NULL, "name" character varying(30) NOT NULL, CONSTRAINT "uq_tags_name" UNIQUE ("name"), CONSTRAINT "ck_tags_name" CHECK ("name" ~ '^[a-z0-9-]{1,30}$'), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" SERIAL NOT NULL, "category_id" integer NOT NULL DEFAULT '1', "sku" character varying(20) NOT NULL, "name" character varying(120) NOT NULL, "brand" character varying(80), "price" numeric(12,0) NOT NULL, "stock" integer NOT NULL DEFAULT '0', "attributes" jsonb NOT NULL DEFAULT '{}'::jsonb, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_products_sku" UNIQUE ("sku"), CONSTRAINT "ck_products_stock" CHECK ("stock" >= 0), CONSTRAINT "ck_products_price" CHECK ("price" >= 0), CONSTRAINT "ck_products_sku_format" CHECK ("sku" ~ '^[A-Z0-9-]{3,20}$'), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_products_category" ON "products"  ("category_id") `);
        await queryRunner.query(`CREATE TABLE "categories" ("id" SERIAL NOT NULL, "parent_id" integer, "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, CONSTRAINT "uq_categories_slug" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_categories_parent" ON "categories"  ("parent_id") `);
        await queryRunner.query(`CREATE TABLE "payments" ("id" SERIAL NOT NULL, "order_id" integer NOT NULL, "method" character varying(20) NOT NULL, "status" character varying(20) NOT NULL, "amount" numeric(12,0) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "ck_payments_amount" CHECK ("amount" >= 0), CONSTRAINT "ck_payments_status" CHECK ("status" IN ('succeeded', 'failed', 'refunded')), CONSTRAINT "ck_payments_method" CHECK ("method" IN ('card', 'ewallet', 'bank_transfer', 'cod')), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_payments_order" ON "payments"  ("order_id") `);
        await queryRunner.query(`CREATE TABLE "user_profiles" ("user_id" integer NOT NULL, "phone" character varying(20), "address" character varying(255), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6ca9503d77ae39b4b5a6cc3ba88" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying(254) NOT NULL, "full_name" character varying(120) NOT NULL, "role" character varying(20) NOT NULL DEFAULT 'customer', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_users_email" UNIQUE ("email"), CONSTRAINT "ck_users_role" CHECK ("role" IN ('customer', 'admin')), CONSTRAINT "ck_users_email_lower" CHECK ("email" = lower("email")), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "shipping_fee" numeric(12,0) NOT NULL DEFAULT '0', "discount_code" character varying(40), "discount_amount" numeric(12,0) NOT NULL DEFAULT '0', "total_amount" numeric(12,0) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "ck_orders_amounts" CHECK ("shipping_fee" >= 0 AND "discount_amount" >= 0 AND "total_amount" >= 0), CONSTRAINT "ck_orders_status" CHECK ("status" IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_orders_user" ON "orders"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" SERIAL NOT NULL, "order_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" integer NOT NULL, "unit_price" numeric(12,0) NOT NULL, CONSTRAINT "uq_order_items_order_product" UNIQUE ("order_id", "product_id"), CONSTRAINT "ck_order_items_unit_price" CHECK ("unit_price" >= 0), CONSTRAINT "ck_order_items_quantity" CHECK ("quantity" > 0), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_order_items_product" ON "order_items"  ("product_id") `);
        await queryRunner.query(`CREATE TABLE "product_tags" ("product_id" integer NOT NULL, "tag_id" integer NOT NULL, CONSTRAINT "PK_8ca809b37ff76596b63fe60ac41" PRIMARY KEY ("product_id", "tag_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5b0c6fc53c574299ecc7f9ee22" ON "product_tags"  ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f2cd3faf2e129a4c69c05a291e" ON "product_tags"  ("tag_id") `);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "fk_products_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "fk_categories_parent" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "fk_payments_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "fk_user_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "fk_order_items_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "fk_order_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_tags" ADD CONSTRAINT "fk_product_tags_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_tags" ADD CONSTRAINT "fk_product_tags_tag" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_tags" DROP CONSTRAINT "fk_product_tags_tag"`);
        await queryRunner.query(`ALTER TABLE "product_tags" DROP CONSTRAINT "fk_product_tags_product"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "fk_order_items_product"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "fk_order_items_order"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "fk_orders_user"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "fk_user_profiles_user"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "fk_payments_order"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "fk_categories_parent"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "fk_products_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f2cd3faf2e129a4c69c05a291e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b0c6fc53c574299ecc7f9ee22"`);
        await queryRunner.query(`DROP TABLE "product_tags"`);
        await queryRunner.query(`DROP INDEX "public"."idx_order_items_product"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_user"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user_profiles"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payments_order"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP INDEX "public"."idx_categories_parent"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_category"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
