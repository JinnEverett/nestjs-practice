import { ordersByUser } from './orders.js';

export const USER_PREFIX = 'USR';
export const users = new Map([[1, { id: 1, name: 'An' }]]);
export const userLabel = (id) => `${USER_PREFIX}-${id} ${users.get(id)?.name}`;
export const describeUser = (id) => `${userLabel(id)} có ${ordersByUser(id).length} đơn`;
