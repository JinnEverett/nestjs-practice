// ex05 · paginate — đáp án best practice
//
// - async generator: mỗi trang chỉ được tải khi người dùng đã tiêu thụ hết trang trước.
//   break ở vòng for await → generator dừng ở yield hiện tại, không bao giờ gọi fetchPage tiếp.
// - `yield* items` trả từng item của trang (ủy quyền cho mảng).
// - Vòng do...while: luôn tải trang đầu, dừng khi nextCursor null — trang rỗng giữa chừng vẫn đi tiếp.
// - Lỗi của fetchPage tự lan ra vòng for await của caller.
// Cursor pagination phía server ở R01; bên SQL là keyset pagination (SQL R02).
export async function* paginate(fetchPage) {
  let cursor = null;
  do {
    const { items, nextCursor } = await fetchPage(cursor);
    yield* items;
    cursor = nextCursor;
  } while (cursor !== null && cursor !== undefined);
}
