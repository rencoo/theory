var { time } = require("./counter.js")
setInterval(() => console.log(`time = ${time}`), 1000);
// 对于 CommonJS 模块而言，它是在 运行 counter.js 时，确定要导出 time ，但它是通过把 time 赋值给 exports.time ，因此导出的只是此时 time 的值，也就是0。
// 因此，外界只能拿到 time 导出时的一个值拷贝。模块内变量的更改，外界是看不到的。
