// J12 · ex02 — module CommonJS. Chuyển sang ESM vào answers/ex02.js
const DEFAULT_SEPARATOR = '-';

function slugify(text, separator = DEFAULT_SEPARATOR) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), '');
}

function createSlugger(separator) {
  return (text) => slugify(text, separator);
}

module.exports = createSlugger;
module.exports.slugify = slugify;
module.exports.DEFAULT_SEPARATOR = DEFAULT_SEPARATOR;
