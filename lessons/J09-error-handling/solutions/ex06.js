// ex06 · loadUserProfile — đáp án best practice
//
// Bug gốc: catch-all + return null → (1) user không tồn tại và DB sập trông GIỐNG NHAU với caller;
// (2) lỗi chỉ nằm trong console, không lên monitoring; (3) user null gây TypeError cũng bị nuốt.
//
// - try/catch chỉ bọc ĐÚNG lời gọi hạ tầng có thể lỗi (repo.findById), không bọc cả hàm →
//   NotFoundError ném ra sau đó không bị bắt nhầm và bọc lại.
// - Bọc lỗi hạ tầng bằng AppError có ngữ cảnh + `cause` → log thấy cả lỗi gốc.
// - Không log ở đây: tầng biên (exception filter) log một lần. Log ở mọi tầng = log trùng.
import { AppError, NotFoundError } from './ex02.js';

export function loadUserProfile(id, repo) {
  let user;
  try {
    user = repo.findById(id);
  } catch (cause) {
    throw new AppError('Cannot load profile', { code: 'PROFILE_LOAD_FAILED', statusCode: 503, cause });
  }
  if (user === null || user === undefined) throw new NotFoundError(`User ${id} not found`);
  return { id: user.id, name: user.name };
}
