// CommonJS
async function main() {
  console.log('1 main bắt đầu');
  await null;
  console.log('2 main sau await #1');
  process.nextTick(() => console.log('3 nextTick trong main'));
  await null;
  console.log('4 main sau await #2');
}

setImmediate(() => console.log('5 immediate'));
main().then(() => console.log('6 main xong'));
process.nextTick(() => console.log('7 nextTick ngoài'));
Promise.resolve().then(() => console.log('8 promise ngoài'));
console.log('9 sync cuối');
