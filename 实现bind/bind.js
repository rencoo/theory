Function.prototype.myBind = function (context, ...args) {
    var fn = this;
    if (typeof fn !== 'function') return;
    
    var boundFn;
    var binder = function (...innerArgs) {
        args = args.concat(innerArgs);
        
        // console.log(this instanceof boundFn); // 使用 new 调用时, this 即为构造函数的实例, 判断结果为 true (优先级高于 bind 传入的 context)
        if(this instanceof boundFn) { // new 调用; 不使用bind传入的 context
            var res = fn.apply(this, args);
            if (typeof res === 'object') {
                return res;
            }
            return this;
		} else { // 普通调用
			return fn.apply(context, args);
        }
    }

    boundFn = Function('binder', 'return function (){ return binder.apply(this,arguments); }')(binder);

    if (fn.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = fn.prototype;
        boundFn.prototype = new Empty();
        Empty.prototype = null; 
    }
    
    return boundFn;
}

// 测试
var obj = { age: 25 };
function Person(name) {
	this.name = name;
    console.log(this); // (*)
}

var fn = Person.myBind(obj, 'Bob');

// 调用后, (*)的打印内容
// 普通调用
fn();
// console: { age: 25, name: "Bob" }

// 通过new调用
new fn();
// console: Person { name: 'Bob' }