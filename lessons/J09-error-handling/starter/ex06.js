// J09 · ex06 — code có bug (nuốt lỗi). Viết lại đúng vào answers/ex06.js
export function loadUserProfile(id, repo) {
  try {
    const user = repo.findById(id);
    return { id: user.id, name: user.name };
  } catch (e) {
    console.log('lỗi', e);
    return null;
  }
}
