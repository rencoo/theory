// 函数被调用时, 会产生三个和函数相关的东西
// 执行环境(execution context) 作用域链(scope Chain) 以及变量对象(variable object)
function outerFunction() {
	var a = 1;
	return function () {
		console.log(a);
	}
}

var innerFunction = outerFunction();
innerFunction();

// 伪代码
ExecutionContext = {
	variableObject: {},
	this: thisValue,
	Scope: [] // Scope chain, 所有变量对象的列表
};

// 关于三者，更准确的描述或许是这样的： 在函数调用的时候，
// 会创建一个函数的执行环境，这个执行环境有一个与之对应的变量对象和作用域链

// ex
function foo (arg) {
	var variable = '我是变量';
	function innerFoo () {
		alert("我是彭湖湾")
	}
}
foo('我是参数');

// 这个时候执行环境对应的变量对象就变成了这样：
ExecutionContext = {
	variableObject: { // 变量对象
		variable: '我是变量',
		innerFoo: innerFoo ,// [对函数声明innerFoo的引用]
		arg: '我是参数'
	},
	this: thisValue,
	Scope: [] // 所有变量对象的列表; 作用域链
};

// 通过作用域链，函数能够访问来自它上层作用域（执行环境）中的变量

function foo () {
	var a = 1;
	function innerFoo () {
		console.log(a)
	}
	innerFoo();
}
foo(); // 打印  1

// 在这里，变量a并不是innerFoo作用域（执行环境）内声明的变量呀，为什么能够取到它外部函数foo作用域内的变量呢？
// 这就是作用域链的作用啦，现在的执行环境用汤姆大叔的伪代码描述是这样的：

// 伪代码描述 InnerFoo函数的执行环境
InnerFooExecutionContext = {
	variableObject: {
		arg: arguments,
	},
	this: thisValue,
	Scope: [ // Scope chain
		innerFooExecutionContext.variableObject,  // innerFoo的变量对象
		FooExecutionContext.variableObject,  // foo的变量对象
		globalContext.variableObject  // 全局执行环境window的变量对象
	]
};

// Foo函数的执行环境：
FooExecutionContext = {
	variableObject: {
		a: 1,
		innerFoo: innerFoo ,// [对函数声明innerFoo的引用]
		arg: arguments,
	},
	this: thisValue,
	Scope: [ // Scope chain
		FooExecutionContext.variableObject,  // Foo的变量对象
		globalContext.variableObject   // 全局执行环境window的变量对象
	]
};

// 作用域链其实就是个从当前函数的变量对象开始，从里到外取出所有变量对象，组成的一个列表。
// 通过这个作用域链列表，就可以实现对上层作用域的访问

// innerFoo在自己的执行环境的变量对象中没有找到a 的变量声明， 它感到很苦恼，
// 但转念一想： 诶！ 我可以向上层函数执行环境的变量对象(variableObject)中找嘛！
// 于是乎沿着作用域链( Scope chain)攀爬，
// 往上找变量a，幸运的是，在父函数Foo的变量对象，它找到了自己需要的变量a

// 闭包和柯里化
// 闭包和函数柯里化在定义一个函数的时候，可能会使用到多层嵌套的闭包，
// 这种用法，叫做“柯里化”。 而闭包柯里化有两大作用：参数累加和延迟调用!!!!!
function foo (a) {
	return function (b) {
		return function (c) {
			console.log(a + b + c);
		}
	}
}

foo('我')('真')('帅'); // 我真帅

function foo(a) {
	return function (b) {
		return function (c) {
			console.log(a + b + c);
		}
	}
}

var foo1 = foo('我');
var foo2 = foo1('真');
foo2('帅');

// 利用闭包实现bind
var o = {
	a: 1,
	b: 1,
	c: 1,
};

// function Type(a, b, c) {
// 	this.a = a;
// 	this.b = b;
// 	this.c = c;
// }
//
// Type.prototype.add = function () {
// 	return this.a + this.b + this.c
// };

function add() {
	return this.a + this.b + this.c
}

function bind(fn, obj) {
	return function () {
		return fn.call(obj, arguments); // 别忘了 return
	};
}

var objAdd = bind(add, o);
// var objAdd = bind(Type.prototype.add, o);
objAdd(); // 运行

// 闭包造成的额外的内存占用 （注意我说的不是“内存泄漏”！）
// 函数的变量对象一般在函数调用结束后被销毁（它的“任务”已经完成了，可以被垃圾回收了）
function foo (a) {
	return function () {
		console.log(a)
	}
}

var foo1 = foo(1);
var foo2 = foo(2);
var foo3 = foo(3);
foo1();  // 输出1
foo2();  // 输出2
foo3();  // 输出3

// 实际上，foo函数调用结束后， foo函数的变量对象并不会被立即销毁，
// 而是只有当取得foo函数闭包的值的foo1, foo2, foo3调用结束，
// 这三个函数的变量对象和作用域链被销毁后，
// foo函数才算“完成任务”，这时，它才能被销毁。

// 所以说，闭包会造成额外的内存占用(注意这种内存占用是有必要的，和内存泄漏不同！！)

// 闭包只能取得包含函数的最后一个值
function createArray() {
	var arr = [];
	for (var i = 0; i < 10; i++) {
		arr[i] = function () {
			return i;
		}
	}
	return arr;
}
var funcs = createArray();
for (var i = 0; i < funcs.length; i++) {
	console.log(funcs[i]());
}

// 输出10个10, 所有闭包引用的都是同一个i(作用域链中createArray的变量对象)，
// 一开始是0, 等闭包被调用时该变量已经变为10了

// 1. 这几个函数都保留着对同一个外部函数的变量对象的引用
// 2. 因为闭包函数“延迟调用”的特性，而关键变量值i的获取是在闭包函数调用（也即funcs[i]()）的时候,
// 才从外部函数的变量对象中获取，而这个时候，外部函数早就完成for循环使 i =10了 !!!


