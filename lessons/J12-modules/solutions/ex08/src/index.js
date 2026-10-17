const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export const VERSION = '1.0.0';
export const FORMAT = 'esm';
export const formatVnd = (amount) => VND.format(amount);
