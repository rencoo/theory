var obj = {};
Object.defineProperty(obj, 'hello', {
  get() {
    console.log('get方法被调用了');
    return '';
  },
  set(val) {
    console.log('set方法被调用了, 参数是' + val);
  }
});

console.log(obj.hello); // get方法被调用了
obj.hello = 'abc'; // set方法被调用了, 参数是abc

// 访问器属性的"值"比较特殊，读取或设置访问器属性的值，实际上是调用其内部特性：get和set函数。
// obj.hello // 读取属性，就是调用get函数并返回get函数的返回值
// obj.hello = "abc" // 为属性赋值，就是调用set函数，赋值其实是传参

// get 和 set 方法内部的 this 都指向 obj，这意味着 get 和 set 函数可以操作对象内部的值。
// 另外，访问器属性的会"覆盖"同名的普通属性，因为访问器属性会被优先访问，与其同名的普通属性则会被忽略。
