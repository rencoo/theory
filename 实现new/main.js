function myNew (Fn, ...args) {
    // 1.生成一个空对象作为this
    // 2.将对象链接到原型上
    let obj = Object.create(Fn.prototype)
    // 3.执行构造函数, 并将obj作为context传入(为实例对象添加属性)
    let res = Fn.apply(obj, args) // 构造函数内的 this 动态改变为 obj
    // 4.return this或者构造函数的执行结果(引用类型)
    return typeof res === 'object' ? res : obj
    // return result instanceof Object ? res : obj
}

// test
function Person (name, age) {
	this.name = name;
	this.age = age;
}

var a = myNew(Person, 'rencoo', 25)
console.log(a) // Person {name: "rencoo", age: 25}
var b = new Person('ge can', 26)
console.log(b) // Person {name: "gecan", age: 26}

Person.prototype.sayHi = function () {
	console.log(this.name)
}

a.sayHi() // rencoo
b.sayHi() // gecan
