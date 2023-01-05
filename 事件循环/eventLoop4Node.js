// node中的事件循环，相比于浏览器的差异
// 1.事件循环分为6个阶段，在这些阶段中都有宏任务的执行，虽然在每次宏任务执行完，都会立刻执行微任务（这与浏览器相同），
// 但执行完微任务队列后，继续执行宏任务，再到微任务，当该阶段的宏任务执行结束，进入下一阶段。
// 这些都属于同一轮循环中，直到把Node的libuv引擎定义的事件循环的 6 个阶段全跑完，这一轮循环才算结束。
// --- 在6个阶段，会执行不同的宏任务，以及对应的微任务；就算有的宏任务创建的比较早，但是在6个阶段里比较靠后的位置，那可能也不会先执行
// 2.nextTick 非事件循环里的内容，优先执行
/**
setTimeout(() => {
  console.log('setTimeout1');
  Promise.resolve().then(() => console.log('promise1'));
});

setTimeout(() => {
  console.log('setTimeout2');
  Promise.resolve().then(() => console.log('promise2'));
});

setImmediate(() => {
  console.log('setImmediate1');
  Promise.resolve().then(() => console.log('promise3'));
});

setImmediate(() => {
  console.log('setImmediate2');
  Promise.resolve().then(() => console.log('promise4'));
});
*/
// node 12.x
// setTimeout1
// promise1
// setTimeout2
// promise2
// setImmediate1
// promise3
// setImmediate2
// promise4

// 与v8浏览器端执行一致

// node 10.x
// setTimeout1
// setTimeout2
// promise1
// promise2
// setImmediate1
// setImmediate2
// promise3
// promise4

const fs = require('fs');

/**
fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log('setTimeout');
  }, 0);

  setImmediate(() => {
    console.log('setImmediate');

    process.nextTick(() => {
      console.log('nextTick2');
    });
  });

  process.nextTick(() => {
    console.log('nextTick1');
  });
});

*/

// nextTick1
// setImmediate
// nextTick2
// setTimeout

setImmediate(() => {
  console.log('setImmediate'); // check 阶段
});

fs.readdir(__dirname, () => {
  console.log('fs.readdir'); // poll
});

setTimeout(() => {
  console.log('setTimeout'); // timers
});

Promise.resolve().then(() => {
  console.log('promise');
});
// promise
// setTimeout
// fs.readdir
// setImmediate

setTimeout(() => console.log(1));
setImmediate(() => console.log(2));
Promise.resolve().then(() => console.log(3)); // 本轮循环
process.nextTick(() => console.log(4)); // 本轮循环
(() => console.log(5))();
// 5 4 3 1 2 // 或者 2 1


// https://lynnelv.github.io/js-event-loop-nodejs
setTimeout(() => {
  console.log('timer1');

  Promise.resolve().then(function () {
    console.log('promise1');
  });
}, 0);

setTimeout(() => {
  console.log('timer2');

  Promise.resolve().then(function () {
    console.log('promise2');
  });
}, 0);
// node 和 浏览器执行有差异
