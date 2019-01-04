// js是遵循静态作用域的
// 词法作用域其实是指作用域在词法解析阶段既确定了，不会改变
var foo = 1;

function sta() {
	console.log(foo);
}

(function () {
	var foo = 2;
	sta();
})();
// 打印出1 而不是 2
// 因为sta的scope在创建时，记录的foo是1。如果js是动态作用域，那么他应该弹出2

var foo = 1;

function sta() {
	console.log(foo);
}

(function () {
	foo = 2;
	sta();
})();
// 打印出2, 记录得foo依旧是全局变量, 只不过在其运行时, 已经变为2了

var foo = 1;

function sta() {
	console.log(foo);
}

(function () {
	sta();
	foo = 2;
})();

// 1

var obj = {foo: 1};
function sta() {
	console.log(obj.foo);
}

(function () {
	var obj = {foo: 2};
	sta();
})();
// 1

var obj = {foo: 1};
function sta() {
	console.log(obj.foo);
}

(function () {
	obj.foo = 2;
	sta();
})();
// 2