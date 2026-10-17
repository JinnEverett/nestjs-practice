// ES module (package.json có "type": "module")
console.log('1 sync đầu');
setTimeout(() => console.log('2 timeout 20ms'), 20);
setImmediate(() => console.log('3 immediate'));
process.nextTick(() => console.log('4 nextTick'));
Promise.resolve().then(() => console.log('5 promise'));
queueMicrotask(() => console.log('6 queueMicrotask'));
process.nextTick(() => {
  console.log('7 nextTick #2');
  Promise.resolve().then(() => console.log('8 promise trong nextTick'));
});
console.log('9 sync cuối');
