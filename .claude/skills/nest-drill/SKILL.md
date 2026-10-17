---
name: nest-drill
description: |
  Luyện nhanh 10–15 phút: đoán output đoạn code JS/TS, tìm bug, viết hàm nhỏ, câu hỏi khái niệm Node/Nest, ưu tiên điểm yếu trong weaknesses.md và các module đến hạn ôn. Có chế độ phỏng vấn.
  Triggers: /nest-drill, "ôn nhanh", "drill", "kiểm tra nhanh", "luyện phỏng vấn nodejs", "luyện phỏng vấn nestjs", "quiz js"
---

# Nest Drill: luyện nhanh và ôn tập

## Chế độ (theo args, mặc định `review`)
| Mode | Nội dung |
|---|---|
| `review` | Ôn điểm yếu và module đến hạn. Đây là chế độ mặc định |
| `topic <ID/chủ đề>` | Drill riêng một chủ đề |
| `interview` | Mô phỏng phỏng vấn backend Node/Nest: 5–6 câu, xen lý thuyết ("event loop có mấy phase?", "guard khác interceptor thế nào?") với live coding nhỏ, có chấm điểm |
| `predict` | Cho trước đoạn code (thứ tự log async, `this`, coercion, closure, lifecycle Nest), người học đoán output mà không chạy |
| `bug` | Cho trước đoạn code có 1–2 bug thực tế (quên await, mất `this`, mutate, N+1, DI sai scope), người học chỉ ra và sửa |
| `load` | Cho trước endpoint và bảng bench ở `1,10` conns, người học đoán số đo ở `100,500` conns và data `m` (RPS, p99, lỗi, nút thắt), sau đó chạy `bench` để chấm. Chấm theo xu hướng và điểm gãy, không đòi đúng con số |

## Chọn câu hỏi (mode review)
1. Đọc `progress/weaknesses.md`, ưu tiên dòng có `count` cao và lâu chưa ôn.
2. Đọc `progress/tracker.md`, lấy các module ✅ có "Ôn lại lúc" ≤ hôm nay.
3. Ra tổng cộng 8–10 câu, trộn 4 dạng:
   - **Đoán output**: đoạn code ≤ 15 dòng. In ra gì, theo thứ tự nào?
   - **Tìm lỗi**: một đoạn code có bug. Chỉ ra bug và hậu quả.
   - **Viết nhanh**: một yêu cầu nhỏ, viết hàm ≤ 10 dòng (hoặc 1 decorator/guard nhỏ ở Tier C+).
   - **Khái niệm**: câu hỏi ngắn kiểu "khi nào dùng REQUEST scope?", "`Promise.all` reject khi nào?", "vì sao không dùng float cho tiền?"

## Luật chơi
- Mỗi lượt 1 câu. Chờ người học trả lời rồi mới chấm, sau đó mới ra câu tiếp.
- Chấm ngay: ✅ hoặc ❌ kèm giải thích 1–2 câu. Câu đoán output và câu viết code: **chạy thật** (`node -e` hoặc file tạm trong scratchpad) để kiểm chứng, không chấm theo trí nhớ.
- Không dùng hint trong drill. Trả lời sai thì giải thích luôn, vì mục tiêu của drill là ôn lại.
- Lưu bản ghi buổi vào `drills/<YYYY-MM-DD>.md` (nếu trong ngày có nhiều buổi thì thêm hậu tố `-2`, `-3`…), gồm câu hỏi, câu trả lời của người học và kết quả.

## Cập nhật sau drill
- `weaknesses.md`: trả lời đúng thì tăng "Streak đúng", sai thì reset về 0 và tăng `count`. Dòng nào đạt streak 3 thì chuyển xuống mục "Đã khắc phục".
- `tracker.md`: module được ôn đạt (≥ 80%) thì nhảy sang mốc ôn tiếp theo. Không đạt thì đổi sang 🔁. Thêm 1 entry nhật ký.
- Tóm tắt 2 dòng: điểm số và câu cần nhớ nhất.
