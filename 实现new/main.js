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
console.log(a)
// Person {name: "rencoo", age: 25}
var b = new Person('ge can', 26)
console.log(b)
// Person {name: "gecan", age: 26}

Person.prototype.sayHi = function () {
	console.log(this.name)
}

a.sayHi() // rencoo
b.sayHi() // gecan


// https://zhuanlan.zhihu.com/p/113015729
function newFake() {
    var obj = new Object()

    // 取出第一个参数即要传入的构造函数。此外shift 会修改原数组故arguments会被去除第一个参数
    var constructor = Array.prototype.shift.call(arguments) // 通过call()让arguments能够借用shift方法

    // 关联 __proto__ 到 constructor.prototype
    // 这样 obj 就可以访问到构造函数原型中的属性
    obj.__proto__ = constructor.prototype

    // 将构造函数的 this 指向新建的对象
    // 这样 obj 就可以访问到构造函数中的属性
    var result = constructor.apply(obj, arguments);

    // 返回类型判断, 如果是对象则返回构造函数返回的对象；否则返回创建的新对象
    return typeof result === 'object' ? result : obj;
};
