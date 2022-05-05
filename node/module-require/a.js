/**
const object = {};
object.name = 'I am a.js';
module.exports = object;
 */

/**
 * 1.模块导出是个对象时
(function() {
  return function moduleFunction(exports) {
    exports.name = 'I am a.js';
  };
})();
*/

/**
 * 2.模块导出对象、函数、变量等等
(function() {
  return function moduleFunction(module, exports) {
    module.exports = function() {
      return 'I am a.js';
    };
  };
})();
*/

/**
 * 3.模块依赖其他模块时; exports 变量有用？
 */
(function() {
  return function moduleFunction(module, exports, require) {
    const b = require('b.js');
    module.exports = function() {
      console.log(b.name);
      return 'I am a.js';
    };
  };
})();
