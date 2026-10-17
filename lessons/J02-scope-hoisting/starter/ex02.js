// J02 · ex02 — code có bug. Viết lại đúng vào answers/ex02.js
export function makeHandlers(names) {
  var handlers = [];
  for (var i = 0; i < names.length; i++) {
    handlers.push(function () {
      return 'Hello, ' + names[i] + ' #' + i;
    });
  }
  return handlers;
}
