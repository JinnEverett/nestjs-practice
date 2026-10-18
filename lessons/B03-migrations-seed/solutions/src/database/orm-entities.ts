import { CategoryEntity } from './entities/category.orm-entity';
import { OrderItemEntity } from './entities/order-item.orm-entity';
import { OrderEntity } from './entities/order.orm-entity';
import { PaymentEntity } from './entities/payment.orm-entity';
import { ProductEntity } from './entities/product.orm-entity';
import { TagEntity } from './entities/tag.orm-entity';
import { UserProfileEntity } from './entities/user-profile.orm-entity';
import { UserEntity } from './entities/user.orm-entity';

/** Danh sách entity dùng chung cho ứng dụng Nest và CLI migration (`data-source.ts`): một nơi duy nhất, không thể lệch nhau. */
export const ORM_ENTITIES = [ProductEntity, CategoryEntity, TagEntity, UserEntity, UserProfileEntity, OrderEntity, OrderItemEntity, PaymentEntity];
