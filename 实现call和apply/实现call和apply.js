var person = {
    fullName (txt) {
        console.log(txt + this.firstName + " " + this.lastName);
    }
};

var anotherPerson = {
    firstName: "John",
    lastName: "Doe",
};

person.fullName.call(anotherPerson, "Hello, ");
// cosole: Hello, John Doe

// person.fullName() -> 隐式绑定
// person.fullName.call(anotherPerson, ...) -> 显式绑定

// 第一步
// this就是person.fullName这个函数的定义，(函数-实例)
// 我们在context上添加了一个fn方法，让它等于fullName这个函数，然后调用这个函数
Function.prototype.myOwnCall = function(context) {
    console.log(this);
    context.fn = this;
    context.fn();
};

// test
person.fullName.myOwnCall(anotherPerson, "Hello, ");
// console: undefinedJohn Doe

// 如果看call的文档可以发现，如果第一个参数传入的是null的情况下，this会指向window
Function.prototype.myOwnCall = function(context) {
    context = context || window;
    context.fn = this;
    var result = context.fn(); // 如果fullName有返回值
    return result;
};

// 第二步
// call函数传入的第二个参数开始，作为person.fullName的参数传入
Function.prototype.myOwnCall = function(context) {
    context = context || window;
    context.fn = this;

    var args = [];
    for (var i = 1; i < arguments.length; i++) {  
        args.push("arguments[" + i + "]");
    }

    var result = eval("context.fn(" + args + ")");
    return result;
};

// 使用ES6获得传入的参数
Function.prototype.myOwnCall = function(context) {
    context = context || window;
    context.fn = this;

    var args = Array.prototype.slice.call(arguments);
    // var args = Array.from(arguments);
    var result = context.fn(...args.slice(1));
    return result;
};

// 第三步
// 不更改person和person1的任何属性和方法
// 对于person来说，我们的代码并没有更改任何属性或者方法。
// 但对于anotherPerson，我们增加了一个fn方法，因此，要把这个方法在运行之后删掉：
// 这正好符合 call是临时显式调用的特点
// delete context.fn;

// 但是，又出现了一个问题，如果person1本身就有一个方法叫做fn怎么办？
// 那不是调用call之后，就会把它本身这个方法删掉了么？
// 有的朋友会说，那起一个复杂点的函数名，保证其他人不会起这么少见的名称不就完了么？
// 不行，这也不能保证万无一失。

// 怎么办？我们可以用Math.random()随机生成一个id，
// 如果这个id已经存在于person1上，那么再生成一个id。好了，最终的程序是这样的：

Function.prototype.myOwnCall = function(context) {
    context = context || window;

    // 生成一个对象不存在的属性名, 来用作临时函数调用, 并且在调用之后进行删除
    var uniqueID = "00" + Math.random();
    while (context.hasOwnProperty(uniqueID)) {
      uniqueID = "00" + Math.random();
    }
    context[uniqueID] = this;
  
    var args = Array.prototype.slice.call(arguments);
    // var args = Array.from(arguments);
    var result = context[uniqueID](...args.slice(1));
    delete context[uniqueID];
    return result;
};

// 实现apply
// 只需要注意一下，第二个参数是否存在就可以：
Function.prototype.myOwnApply = function(context, arr) {
    context = context || window;

    var uniqueID = "00" + Math.random();
    while (context.hasOwnProperty(uniqueID)) {
      uniqueID = "00" + Math.random();
    }
    context[uniqueID] = this;
  
    var args = [];
    var result = null;
   
    if (!arr) {
      result = context[uniqueID]();
    } else {
      for (var i = 0; i < arr.length; i++) { 
        args.push("arr[" + i + "]");
      }
      result = eval("context[uniqueID](" + args + ")");
    }

    delete someOtherThis[uniqueID];
    return result;
  };
