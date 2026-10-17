-- Chạy 1 lần khi volume còn trống.
-- shop_dev: DB chạy app khi dev. shop_test: DB cho e2e test (bị xóa/tạo lại bảng liên tục).
-- shop_xs / shop_s / shop_m: bậc thang dữ liệu, sinh ở B03 bằng `npm run seed -- --scale <s>`.
CREATE DATABASE shop_dev;
CREATE DATABASE shop_test;
CREATE DATABASE shop_xs;
CREATE DATABASE shop_s;
CREATE DATABASE shop_m;
