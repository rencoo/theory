// 从bind的定义描述中可以看到，我们要写的这个函数的输入输出基本确定了：
// 输入：接受一个或者多个参数，第一个是要绑定的上下文，额外参数当作绑定函数的前置参数。
// 输出：返回原函数的拷贝，即返回一个函数，这个函数呢具备原函数的功能

// 定义这个方法为myBind
Function.prototype.myBind = function (thisArg) {
	if(typeof this !== 'function') return;
	var that = this;
	var args = Array.prototype.slice.call(arguments, 1); // 从第二个参数截取
	return function () {
		return that.apply(thisArg, args.concat(Array.prototype.slice.call(arguments)));
	}
};

// 我们来测试一下
function foo(name) {
	this.name = name;
}

var obj = {};

// 上下文功能  done
var bar = foo.myBind(obj);
bar('jack');
console.log(obj.name); // 'jack'

// 参数 功能   done
var tar = foo.myBind(obj, 'rose');
tar();
console.log(obj.name); // 'rose'

// new 功能   error
var alice = new bar('alice');
console.log(obj.name);   // alice
console.log(alice.name); // undefined(alice name should be 'alice')

// 可以看到使用new实例化被绑定的方法，上下文还指向了传入的obj，这个方法有点问题，
// 我们需要考虑到的是在myBind的实现里面，需要检测new的操作

// 我们先考虑一下new操作符在调用构造函数时做了哪些操作？
// 比如说 var a = new b()

// 创建一个新的对象 newObj{}
// 继承被实例化函数的原型 ：newObj.__proto__ = b.prototype
// 将这个对象newObj绑定到构造函数b中的 this
// 如果没有返回其他对象，new 操作符调用的函数则会返回这个对象newObj

Function.prototype.myBind = function (thisArg) {
	if (typeof this !== 'function') return;
	var that = this;
	var args = Array.prototype.slice.call(arguments, 1);
	var fnBound = function () {
		// 检测 New
		// 如果当前函数的this指向的是构造函数中的this则判定为new操作
		// console.log(this); // window 或者 构造函数中的this
		var self = this instanceof that ? this : thisArg;
		return that.apply(self, args.concat(Array.prototype.slice.call(arguments)));
	};

	// 为了完成 new操作
	// 还需要做一件事情 执行原型 链接
	fnBound.prototype = this.prototype;
	return fnBound;
};

// test ok
function foo(name) {
	this.name = name;
}
var obj = {};
var bar = foo.myBind(obj);
// console.log(bar); // fnBound 函数体
bar('Jack');
console.log(obj.name);  // Jack
var alice = new bar('Alice');
console.log(obj.name);  // Jack
console.log(alice.name);    // Alice