// 1.创建一个空对象作为this
// 2.将该对象链接到原型对象
function myNew() {
    // 构造函数就是传入的第一个参数
    var constructor = Array.prototype.shift.call(arguments);
    var obj = Object.create(constructor.prototype);
}
// 3.执行构造函数中的代码(为新对象添加属性)
function myNew() {
    // 构造函数就是传入的第一个参数
    var constructor = Array.prototype.shift.call(arguments);
    var obj = Object.create(constructor.prototype);
    var result = constructor.apply(obj, arguments);
}
// 3.将构造函数的作用域赋给该对象(此时this指向该对象)
// 4.return this(如果函数不返回任何引用类型值)
function myNew() {
    // 构造函数就是传入的第一个参数
    var constructor = Array.prototype.shift.call(arguments);
    var obj = Object.create(constructor.prototype);
    var result = constructor.apply(obj, arguments); // this动态改变为obj

    return result instanceof Object ? result : obj;
}