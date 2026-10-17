// Phần dùng chung được tách ra: cả users.js và orders.js cùng phụ thuộc module này,
// còn module này không phụ thuộc ai → đồ thị phụ thuộc là cây, không có vòng.
export const USER_PREFIX = 'USR';
export const users = new Map([[1, { id: 1, name: 'An' }]]);
export const userLabel = (id) => `${USER_PREFIX}-${id} ${users.get(id)?.name}`;
