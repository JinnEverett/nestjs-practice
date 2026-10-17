// J09 · ex01 — ĐỌC, ĐỪNG CHẠY. Đoán output rồi ghi vào answers/ex01.txt
function f1() {
  try {
    return 'try';
  } finally {
    console.log('A finally chạy');
  }
}
console.log('B', f1());

function f2() {
  try {
    return 'try';
  } finally {
    return 'finally';
  }
}
console.log('C', f2());

function f3() {
  try {
    throw new Error('gốc');
  } catch (e) {
    throw new Error('bọc', { cause: e });
  } finally {
    console.log('D cleanup');
  }
}
try {
  f3();
} catch (e) {
  console.log('E', e.message, e.cause.message);
}

try {
  throw 'chuỗi';
} catch (e) {
  console.log('F', typeof e, e instanceof Error);
}

try {
  null.x;
} catch (e) {
  console.log('G', e.name, e instanceof TypeError);
}

try {
  undefinedFn();
} catch {
  console.log('H', 'catch không cần biến');
}

function f4() {
  let n = 0;
  try {
    n = 1;
    return n;
  } finally {
    n = 2;
  }
}
console.log('I', f4());

try {
  try {
    throw new RangeError('trong');
  } finally {
    console.log('J inner finally');
  }
} catch (e) {
  console.log('K', e.name);
}
