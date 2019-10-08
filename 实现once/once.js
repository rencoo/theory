/**
 * Ensure a function is called only once
 */
function once(fn) {
	let flag = false;
	return function() {
		let res = !flag && fn.apply(this, arguments);
		flag = true;
		return res;
	}
}

// function once(fn) {
// 	return function() {
// 		let res = fn && fn.apply(this, arguments);
// 		fn = null;
// 		return res;
// 	}
// }