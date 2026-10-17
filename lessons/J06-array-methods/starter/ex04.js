// J06 · ex04 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex04.txt
const show = (label, fn) => {
  try {
    console.log(label, fn());
  } catch (e) {
    console.log(label, e.name);
  }
};

show('A', () => [10, 9, 1, 100].sort().join(','));
show('B', () => ['1', '2', '3'].map(parseInt).join(','));
show('C', () => [1, 2, 3].forEach((x) => x * 2));
show('D', () => [5, 12, 8].find((x) => x > 6));
show('E', () => [].some((x) => x) + ' ' + [].every((x) => x));
show('F', () => [NaN].indexOf(NaN) + ' ' + [NaN].includes(NaN));
show('G', () => Array(3).map(() => 'x').length + ' ' + Array(3).map(() => 'x')[0]);
show('H', () => Array.from({ length: 3 }, (_, i) => i * i).join(','));
show('I', () => [].reduce((a, b) => a + b));
show('J', () => {
  const a = [3, 1, 2];
  const b = a.sort();
  return a === b;
});
show('K', () => [[1, [2]], [3]].flat().length);
