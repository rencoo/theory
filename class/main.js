// 在JavaScript中, class类是一种函数
class User {
    constructor(name) {
        this.name = name;
    }

    sayHi() {
        alert(this.name);
    }
}

alert(typeof User); // function

// class User {...} 构造器内部干了啥:
// 1.创建一个以User为名称的函数, 这是类声明的结果(函数代码来自于 constructor 中)
// 2.储存所有方法,例如User.prototype中的sayHi
// 然后，对于新的对象，当我们调用方法时，它取自原型

class User {
    constructor(name) { this.name = name; }
    sayHi() { alert(this.name); }
}

// 类是函数
alert(typeof User); // function

// ...或者，更确切地说是构造方法
alert(User === User.prototype.constructor); // true

// User.prototype 中的方法，比如：
alert(User.prototype.sayHi); // alert(this.name);

// 实际上在原型中有两个方法
alert(Object.getOwnPropertyNames(User.prototype)); // constructor, sayHi

// class并不是JavaScript中的语法糖, 虽然我们可以在没有 class 的情况下声明同样的内容：
// 以纯函数的重写 User 类

// 1. 创建构造器函数
function User(name) {
 this.name = name;
}
// 任何函数原型默认具有构造器属性，
// 所以，我们不需要创建它

// 2. 向原型中添加方法
User.prototype.sayHi = function() {
    alert(this.name);
};

// 使用方法：
let user = new User("John");
user.sayHi();

// 两者存在重大差异
// 1.首先，通过 class 创建的函数是由特殊内部属性标记的 [[FunctionKind]]:"classConstructor"。所以，相较于手动创建它还是有点不同的。
// 并且调用类构造器时必须要用 new 关键词：
class User {
    constructor() {}
}

alert(typeof User); // function
User(); // Error: 没有 ‘new’ 关键词，类构造器 User 无法调用

// 此外，大多数 JavaScript 引擎中的类构造函数的字符串表示形式都以 “class” 开头
class User {
    constructor() {}
}

alert(User); // class User { ... }

// 2.类方法不可枚举。 对于 "prototype" 中的所有方法，类定义将 enumerable 标记设为 `false。
// 这很好，因为如果我们对一个对象调用 for..in 方法，我们通常不希望 class 方法出现。
// 枚举实例属性时, 不会出现class方法; 而普通创建的构造函数, 枚举实例属性时会出现prototype上的方法

// 3.类默认使用 use strict。 在类构造函数中的所有方法自动使用严格模式。