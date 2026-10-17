// ex06 · buildIndex / search — đáp án best practice (inverted index)
//
// - Regex `\p{L}+` với cờ u: chuỗi CHỮ CÁI Unicode → tiếng Việt có dấu được giữ nguyên, số và dấu câu bị bỏ.
// - toLocaleLowerCase('vi') để hạ chữ đúng locale.
// - Map<word, Set<id>>: Set tự loại trùng khi từ lặp lại trong cùng doc.
// - search: lấy Set của từ hiếm nhất trước (ít phần tử) rồi lọc → giao nhỏ nhất, nhanh hơn.
// Production: Postgres full-text search (tsvector + GIN) hoặc Elasticsearch/Meilisearch (R10).
const tokenize = (text) => (text.toLocaleLowerCase('vi').match(/\p{L}+/gu) ?? []);

export function buildIndex(docs) {
  const index = new Map();
  for (const { id, text } of docs) {
    for (const word of tokenize(text)) {
      if (!index.has(word)) index.set(word, new Set());
      index.get(word).add(id);
    }
  }
  return index;
}

export function search(index, query) {
  const words = [...new Set(tokenize(query))];
  if (words.length === 0) return [];
  const postings = words.map((w) => index.get(w) ?? new Set()).toSorted((a, b) => a.size - b.size);
  const [smallest, ...rest] = postings;
  return [...smallest].filter((id) => rest.every((set) => set.has(id))).toSorted((a, b) => a - b);
}
