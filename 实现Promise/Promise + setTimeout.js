var promise = new Promise((resolve, reject) => {
    setTimeout(function() {
        resolve('foo'); // 异步数据交给resolve
    }, 1500);
});

promise.then(res => {
    console.log(res);
});