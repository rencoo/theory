Function.prototype.bind = function (a) { 
    var fn = this, 
        args = Array.prototype.slice.call(arguments); 
    a = args.shift(); 
    return function () { 
        return fn.apply(a, args.concat(Array.prototype.slice.call(arguments))) 
    } 
};