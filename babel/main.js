// ES6 转 ES5 目前行业标配是用 Babel，转换的大致流程如下
// 1.解析：解析代码字符串，生成AST
// 2.转换：按一定的规则转换、修改AST
// 3.生成：将修改后的AST转换成普通代码

// ex 将 let 转换为 var
let a = 3
let b = 2
console.log(a + b)
