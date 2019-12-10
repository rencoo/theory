function throttle (fn, delay) {
    var timer = null;
    return function (...args) {
        clearTimeout(timer); // 将上一次的操作取消掉
        timer = setTimeout(() => fn.apply(this, args), delay);
    }
}

// 优化，对于第一次操作总是调用函数，这样用户的操作会被立即响应，提升用户体验
function throttle_optimize (fn, delay) {
    var flag = true, timer = null;
    return function (...args) {
        if (flag) {
            flag = false;
            fn.apply(this, args);
            args = null;
        }

        clearTimeout(timer);
        timer = setTimeout(() => {
            flag = true;
            if (args) {
                fn.apply(this, args);
            }
        }, delay);
    }
}

// 用于动画渲染
function throttle_optimize2(func, ms) {

    let isThrottled = false,
        savedArgs,
        savedThis;

    function wrapper() {
        if (isThrottled) {
            savedArgs = arguments;
            savedThis = this;
            return;
        }

        func.apply(this, arguments);
        isThrottled = true;

        setTimeout(function () {
            isThrottled = false;
            if (savedArgs) {
                wrapper.apply(savedThis, savedArgs);
                savedArgs = savedThis = null;
            }
        }, ms);
    }

    return wrapper;
}