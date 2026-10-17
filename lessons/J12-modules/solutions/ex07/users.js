// ex07 · gỡ vòng import — đáp án best practice
//
// Vòng cũ: users.js ⇄ orders.js. Cách gỡ: tách phần cả hai cùng cần (USER_PREFIX, users, userLabel)
// ra user-label.js. Giờ: users.js → orders.js → user-label.js, users.js → user-label.js. Không vòng.
//
// Quy tắc phòng ngừa: phụ thuộc chỉ đi MỘT chiều (tầng cao → tầng thấp). Trong NestJS, hai module
// cần nhau là dấu hiệu nên tách module chung hoặc dùng event (M02) thay vì forwardRef().
import { ordersByUser } from './orders.js';
import { userLabel } from './user-label.js';

export const describeUser = (id) => `${userLabel(id)} có ${ordersByUser(id).length} đơn`;
