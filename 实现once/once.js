/**
 * Ensure a function is called only once
 */
// function once(fn) {
// 	let flag = false;
// 	return function() {
// 		let res = !flag && fn.apply(this, arguments);
// 		flag = true;
// 		return res;
// 	}
// }

// 更加优雅的写法
function once(fn) {
	// closure here; var fn = fn; // 复制了指针
	return function() {
		let res = fn && fn.apply(this, arguments);
		fn = null; // 将闭包中的指针指向 null, 不会影响原 fn
		return res;
	}
}