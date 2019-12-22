// 使用场景, Child.prototype = Object.create(Parent.prototype)
Object.myCreate = function (proto) {
    function F() {}
    F.prototype = proto
    return new F()
}

// test
function Parent () {}
Parent.prototype.sayHi = function () {
    console.log('hi')
}

function Child () {}
Child.prototype = Object.myCreate(Parent.prototype)

let a = new Child()
a.sayHi() // hi
