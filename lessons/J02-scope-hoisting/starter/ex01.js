// J02 · ex01 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex01.txt
const show = (label, fn) => {
  try {
    console.log(label, fn());
  } catch (e) {
    console.log(label, e.name);
  }
};

show('A', () => a);
show('B', () => b);
show('C', () => hello());
show('D', () => typeof c);
show('E', () => arrow());

var a = 1;
let b = 2;
function hello() {
  return 'hi';
}
var arrow = () => 'arrow';

show('F', () => a);
{
  let a = 'block';
  show('G', () => a);
}
show('H', () => a);

for (var i = 0; i < 3; i++) {}
show('I', () => i);
for (let j = 0; j < 3; j++) {}
show('J', () => typeof j);
