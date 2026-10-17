'use strict';

const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

module.exports = {
  VERSION: '1.0.0',
  FORMAT: 'cjs',
  formatVnd: (amount) => VND.format(amount),
};
