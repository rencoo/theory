exports.b ='原始值-b模块内变量' // 需提到最前
var a = require('./a')
console.log('b模块引用a模块',a)
exports.b = '修改值-b模块内变量'