import { userLabel, USER_PREFIX } from './user-label.js';

const OWNER_TAG = `${USER_PREFIX}:owner`;

export const orders = [
  { id: 10, userId: 1, total: 500 },
  { id: 11, userId: 1, total: 300 },
];
export const ordersByUser = (userId) => orders.filter((o) => o.userId === userId);
export const describeOrder = (id) => {
  const o = orders.find((x) => x.id === id);
  return `Đơn ${o.id} của ${userLabel(o.userId)} [${OWNER_TAG}]`;
};
