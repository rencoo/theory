const a = require("./a.js")
module.exports = function () {
    console.log("in b.js function")
}
a() // 报错 TypeError: a is not a function
