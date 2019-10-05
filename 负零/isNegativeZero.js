// 创建一个8位的ArrayBuffer
const buffer = new ArrayBuffer(8);

// 创建DataView对象操作buffer
const dataView = new DataView(buffer);

// 将第1个字节设置为0x80, 即最高位为1
dataView.setUint8(0, 0x80);

// 将buffer内容当做Float64类型返回
console.log(dataView.getFloat64(0)); // -0

console.log(1 / -Infinity); // -0
console.log(-1 / Infinity); // -0
console.log(-Number.MIN_VALUE / 2); // -0
console.log(-1e-1000); // -0

console.log(-0 === 0); // true

var num = -0;
if(!num) { // !num 为 true
    // do sth
}

// 在分母中有-0存在, 恰好又要判断符号的时候, 可能会出问题
var num = -0;

console.log(1 / num > 0); // false; -Infinity
// 1 / 0 => Infinity > 0 // true
console.log(Math.sign(1 / num)); // -1 Math.sign表示正数、负数、正0、负0、NaN

// 判断-0
// num === -0是不行的, 因为0===-0 也会返回true
// ES2015 Object.is(value1, value2)比较两个值是否相同
// Object.is(-0, 0) => false; Object.is(NaN, NaN) => true;

// 在早期的js版本中, 可以通过 1/-0为-Infinity的特点来判断
function isNegativeZero(num) {
    return num === 0 && (1 / num < 0);
}

// 或者写一个Object.is的ployfill
if (!Object.is) {
    Object.is = function(x, y) {
      // SameValue algorithm
      if (x === y) { // Steps 1-5, 7-10
        // Steps 6.b-6.e: +0 != -0
        return x !== 0 || 1 / x === 1 / y;
      } else {
        // Step 6.a: NaN == NaN
        return x !== x && y !== y;
      }
    };
  }