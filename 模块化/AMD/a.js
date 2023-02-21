console.log("before require b from b.lcjs")
define(["b.js"], function (b) {
  console.log("execute a.js")
})
