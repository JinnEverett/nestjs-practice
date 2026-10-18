import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

/** `DataSource` được đăng ký toàn cục bởi `DatabaseModule`, nên không cần `TypeOrmModule.forFeature` ở đây (dùng EntityManager trực tiếp). */
@Module({
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
