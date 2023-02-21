var data = require('./data').data
var modifyData = require('./data').modifyData // ES5语法 // require 运行时，值的拷贝
console.log(data) // data
modifyData()
console.log(data) // data
