function debounce (fn, wait) {
    var flag = true, timer = null;
    return function (...args) {
        if (flag) {
        	flag = false;
            
            timer = setTimeout(function () {
                flag = true;
                clearTimeout(timer);
            }, wait);
            
            return fn.apply(this, args);
        }
    }
}

// function debounce (fn, wait) {
//     var timer = null;
//     return function (...args) {
//         if (!timer) {
//             timer = setTimeout(() => { 
//                 timer = null 
//             }, wait);

//             return fn.apply(this, args);
//         }
//     }
// }