# Thứ tự overlay của shop-api tham chiếu

`assemble.mjs <ID>` áp dụng `solutions/` của các module trong danh sách này, từ trên xuống, **đến hết `<ID>`**.
Module không có thư mục `solutions/` (hoặc không nằm trong danh sách) bị bỏ qua. Mỗi dòng: `- ID`.

## Core
- C01
- C02
- C03
- Q01
- C04
- C05
- C06
- C07
- C08
- C09
- C10
- C11
- C12
- Q03
- Q04

## Database
- B01
- Q02
- B02
- B03
- B04
- B05
- B06
- B07

## Auth
- A01
- A02
- A03
- A04
- A05
- A06

## Production
- P01
- P02
- P03
- P04
- P05
- P06
- P07
- P08
- P09

## Real-world
- R01
- R02
- R03
- R04
- R05
- R06
- R07
- R08
- R09
- R10

## Kiến trúc
- M01
- M02
- M03
- M04
- M05
- M06
- M07
- M08
- M09

## Capstone
- CAP

> Q03 chỉ overlay các spec tham chiếu (`*.spec.ts`, để chạy được `--solutions`); spec nằm trong `src/` nên `tsc --noEmit` của module sau cũng biên dịch chúng: module sau đổi chữ ký các thành phần Q01/Q03 thì phải overlay lại spec tương ứng.
> Q04 overlay các tệp `src/demo/*` đã sửa, `low-stock` và route của nó. Không overlay: B08 (Prisma — dự án so sánh riêng), B09 (Mongo, tùy chọn), D01–D08 (thiết kế, thư mục `designs/`).
