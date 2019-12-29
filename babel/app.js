// acorn 是一个常用的js解析器, 常用到的还有一个 Esprima, acorn 在它之后诞生
// 两者相比, acorn实现代码更少, 速度和Esprima相差无几
// 二者都遵循 The Estree Spec 规范，也就是得到的结果在很大部分上是兼容的。对 ECMAScript 来说，社区有一个 AST 规范：ESTree Spec
// 解析 javascript 的三件套: acorn、acorn-walk、escodegen
const fs = require('fs')
const acorn = require('acorn') // 将js代码转化为语法树模块
const walk = require('acorn-walk') // js语法树遍历各节点
const escodegen = require('escodegen') // 将js语法树反编译成js代码模块

// 1.获取js代码
let code = fs.readFileSync('./main.js')
// 2.用acorn将代码解析为语法树AST
let ast = acorn.parse(code, {
  ranges: true
})
// 3.用walk操作语法树ast，输出node.value
walk.simple(ast, {
  VariableDeclaration(node) {
    if (node.kind === 'let') {
      node.kind = 'var' // 把let变为var
    }
  }
})

fs.writeFileSync('result.json', JSON.stringify(ast)) // 将修改后的语法树ast存储为result.json文件
fs.writeFileSync('result.js', escodegen.generate(ast, { comment: true })) // 用escodegen将语法树转换为最终代码，并存储为result.js

// AST 节点是按照如下的格式定义的 .ts中
// interface Node {
//   type: string,
//   loc: SourceLocation | null
// }

// 1.webpack是使用acorn作为自己的Parser的基础库
// 2.babel,babylon.js 也是fork的acorn实现的
// 一个在线实时查看AST的网站 https://astexplorer.net/
