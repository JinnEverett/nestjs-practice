// J07 · ex05 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex05.txt
process.env.TZ = 'Asia/Ho_Chi_Minh';
const show = (label, fn) => {
  try {
    console.log(label, fn());
  } catch (e) {
    console.log(label, e.name);
  }
};

show('A', () => new Date('2026-10-01').toISOString());
show('B', () => new Date('2026-10-01T00:00').toISOString());
show('C', () => new Date(2026, 9, 1).getMonth());
show('D', () => new Date(2026, 1, 30).getDate());
show('E', () => JSON.stringify({ at: new Date(0) }));
show('F', () => typeof JSON.parse('{"at":"1970-01-01T00:00:00.000Z"}').at);
show('G', () => JSON.stringify({ a: undefined, b: () => 1, c: NaN, d: [undefined] }));
show('H', () => JSON.stringify({ id: 1n }));
show('I', () => (0.1 * 3).toFixed(2) + ' ' + (1.005).toFixed(2));
show('J', () => Number('') + ' ' + Number(' 12 ') + ' ' + Number('1_000'));
show('K', () => '  a,b,,c '.trim().split(',').join('|'));
