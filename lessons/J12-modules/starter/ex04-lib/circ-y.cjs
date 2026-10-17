exports.loaded = false;
const x = require('./circ-x.cjs');
console.log('F', 'y thấy x.loaded =', x.loaded);
exports.loaded = true;
