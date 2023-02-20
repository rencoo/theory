// references
// https://zhuanlan.zhihu.com/p/462189220
const fs = require('fs');

// 用来保存加载过的模块
const cache = {};

// 1.模块导出是个对象时
/**
function __require__(modulePath) {
  if (cache[modulePath]) return cache[modulePath].exports;

  const module = {
    path: modulePath,
    exports: {} // 用来保存模块导出的变量
  };

  cache[modulePath] = module;
  eval(fs.readFileSync(modulePath, { encoding: 'utf-8' }))(module.exports); // 执行脚本内容，得到一个函数，执行这个函数并传入 module

  return module.exports;
}
*/

// 2.模块导出对象、函数等等
/**
(function() {
  return function aModuleFunction(exports) {
    exports = function() { }; // 这样是行不通的！
  };
})();
按照方式一，只传入module.exports是不行的。
显然，上面的代码是错误的，因为 exports 只是一个参数，它是 module.exports 的引用，直接对它赋值，只是让 exports 指向一个函数，并没有实际更改 module.exports 。为了实现这种需求，我们需要直接把 module 传给 a.js 。
*/

/**
function __require__(modulePath) {
  if (cache[modulePath]) return cache[modulePath].exports;

  const module = {
    path: modulePath,
    exports: {} // 用来保存模块导出的变量
  };

  cache[modulePath] = module;
  // ------------- 直接把 module 也传进去  ------------- //
  eval(fs.readFileSync(modulePath, { encoding: 'utf-8' }))(module, module.exports);

  return module.exports;
}
*/

// 3.模块本身依赖其他模块
function __require__(modulePath) {
  if (cache[modulePath]) return cache[modulePath].exports;

  const module = {
    path: modulePath,
    exports: {} // 用来保存模块导出的变量
  };

  cache[modulePath] = module;
  // ------------- 把 require 函数自己也传进去  ------------- //
  eval(fs.readFileSync(modulePath, { encoding: 'utf-8' }))(module, module.exports, __require__);

  return module.exports;
}

/**
 * CommonJS 模块规范最重要的就是三个对象 module，exports，require。
 * module是一个 object ，保存着当前模块的信息，exports 是一个用于导出模块变量的对象，而 require 函数用于导入模块。
 */

// 由于 ES6 Module 标准的推出（JavaScript 语言级别的模块），未来 CommonJS 规范模块可能会慢慢地被取代

// 加载 module.js
const __module__ = __require__('./a.js');
// 1.模块导出对象时
// console.log(__module__); // { name: 'I am a.js' }
// 2.模块导出函数时
// console.log(__module__()); // I am a.js
// 3.模块依赖其他模块时
console.log(__module__());
// I am b.js
// I am a.js
