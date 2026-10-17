exports.loaded = false;
const y = require('./circ-y.cjs');
console.log('E', 'x thấy y.loaded =', y.loaded);
exports.loaded = true;
exports.x = 'x';
