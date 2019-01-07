// 第一步、我们创建这么一个类，里面有`then`和`catch`两个方法，并且能够链式调用，
// 为了防止重复，这里用小写开头的promise
class promise {
	constructor() {

	}

	then(success, fail) {
		// 链式调用
		return this;
	}

	catch(fail) {
		// 链式调用
		return this;
	}
}

// 第二步、因为有`resolve`和`reject`两种状态，
// 那么另外再设立两个函数`resolve`和`reject`分别进行不同的状态管理
class promise {
	constructor() {

	}

	then(success, fail) {
		// 链式调用
		return this
	}

	catch(fail) {
		// 链式调用
		return this
	}

	// 成功状态的管理
	resolve(result) {

	}

	// 失败状态的管理
	reject(result) {

	}
}

// 第三步、设定一个数组对需要执行的方法进行暂存，以及一个方法的执行器，
// 该执行器依赖于`resolve`和`reject`传入的状态进行相应的执行
class promise {
	constructor() {
		this.callbacks = []
	}

	then(success, fail) {
		// 链式调用
		return this
	}

	catch(fail) {
		// 链式调用
		return this
	}

	// 成功状态的管理
	resolve(result) {
		this.actuator('resolve', result)
	}

	// 失败状态的管理
	reject(result) {
		this.actuator('reject', result)
	}

	// 执行器
	actuator(status, result) {

	}
}

// 第四步、编写`then`函数与执行器中的逻辑
// 为了方便查看放到了最上面
let p = new promise();
function f1() {
	console.log('f1');
	setTimeout(function () {
		p.resolve('1')
	}, 1000);
	return p;
}

// ①、在写then函数之前，先看看最开始Promise的调用方式是怎么样的：f1().then(f2).then(f3).catch(f4)，
// 然后在f1中嵌套回调f2并且返回这个Promise对象。
// 此外，then函数可以接受两个参数，一个成功回调一个失败回调，
// 所以思路就是创建一个对象里面有'resolve'和'reject'对应这两个回调然后放入callbacks数组中进行管理；
class promise {
	constructor() {
		this.callbacks = []
	}

	then(success, fail) {
		this.callbacks.push({
			resolve: success,
			reject:fail
		});

		// 链式调用
		return this
	}

	catch(fail) {
		// 链式调用
		return this
	}

	// ②、这时候在调用f1时他会先返回Promise对象，然后再调用setTimeout里面的resolve回调并传入参数，
	// 而在resolve函数中调用了执行器actuator，并且传入了resolve这个状态和在f1中传入的参数；
	// 成功状态的管理
	resolve(result) {
		this.actuator('resolve', result)
	}

	// 失败状态的管理
	reject(result) {
		this.actuator('reject', result)
	}

	// ③、执行actuator函数，其实分析到了这一步就很简单了，
	// 不过是将先前传入callbaks中的函数取出来，然后执行其中的成功回调就是了
	actuator(status, result) {
		// 取出之前传入的回调函数对象（包含成功和失败回调），然后执行
		let handlerObj = this.callbacks.shift();
		handlerObj[type](result)
	}
}


// ④、整体代码
class promise {
	constructor() {
		this.callbacks = []
	}

	then(success, fail) {
		this.callbacks.push({
			resolve: success,
			reject: fail
		});
		// 链式调用
		return this
	}

	catch (fail) {
		// 链式调用
		return this
	}

	// 成功状态的管理
	resolve(result) {
		this.actuator('resolve', result)
	}

	// 失败状态的管理
	reject(result) {
		this.actuator('reject', result)
	}

	// 执行器
	actuator(status, result) {
		// 取出之前传入的回调函数对象（包含成功和失败回调），然后执行
		let handlerObj = this.callbacks.shift();
		handlerObj[status](result)
	}
}

// 其实到了这一步，Promise的基本功能（resolve和reject）已经实现了，
// 下面来看看`f1().then(f2, f4).then(f3, f4).then(f4)`的执行结果吧
// ①、全部resolve状态执行结果

let p = new promise();

function f1() {
	console.log('f1');
	setTimeout(function() {
		p.resolve('1')
	}, 1000);
	return p
}

function f2(result) {
	console.log('f2', result);
	setTimeout(function() {
		p.resolve('2')
	}, 1000)
}

function f3(result) {
	console.log('f3', result);
	setTimeout(function() {
		p.resolve('3')
	}, 1000)
}

function f4(result) {
	console.log('f4', result)
}

f1().then(f2, f4).then(f3, f4).then(f4);
// f1
// promise对象
// f2 1
// f3 2
// f4 3

// 最后、我们再添加`catch`方法进去
// 再上述代码的基础上，`catch`方法的实现其实已经变得很简单了，
// 只需要在constructor里设立一个oncatch用以保存传入catch的回调，
// 然后当中间某个环节reject的时候调用这个oncatch方法就好了，全部实现代码以及调用实例:
class promise {
	constructor() {
		// 定义回调函数管理器和catch
		this.callbacks = [];
		this.oncatch;
	}

	// 当状态为reject时候，传入reject状态给执行器
	reject(result) {
		this.actuator('reject', result)
	}

	// 当状态为resolve时候，传入resolve状态给执行器
	resolve(result) {
		this.actuator('resolve', result)
	}

	// 执行器
	actuator(status, result) {
		// 检测当状态为reject并且oncatch不为空时，执行oncatch保存的失败回调, 适用于f1().then(f2).then(f3).catch(f4)
		if (status === 'reject' && this.catch) {
			this.callbacks = [];
			this.oncatch(result)
			// 检测当callbacks第一位有方法时，执行相应状态的方法，适用于f1().then(f2, f4).then(f3, f4)
		} else if (this.callbacks[0]) {
			let handlerObj = this.callbacks.shift();
			if (handlerObj[status]) {
				handlerObj[status](result)
			}
		}
	}

	then(success, fail) {
		// 将传入的成功和失败回调组成对象，放入回调数组中进行管理
		this.callbacks.push({
			resolve: success,
			reject: fail
		});
		// 用于链式调用
		return this
	}

	catch(fail) {
		// 保存传入的失败回调
		this.oncatch = fail;
		// 用于链式调用
		return this
	}
}


let p = new promise();

function f1() {
	console.log('f1');
	setTimeout(function () {
		p.resolve('1')
	}, 1000);
	return p
}

function f2(result) {
	console.log('f2', result);
	setTimeout(function () {
		p.resolve('2')
	}, 1000)
}

function f3(result) {
	console.log('f3', result);
	setTimeout(function () {
		p.resolve('3')
	}, 1000)
}

function f4(result) {
	console.log('f4', result)
}

// 第一种调用
f1().then(f2).then(f3).catch(f4);
// 第二种调用
f1().then(f2, f4).then(f3, f4);
