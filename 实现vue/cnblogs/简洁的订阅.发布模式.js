// 一个发布者publisher
var pub = {
    publish() {
        dep.notify();
    }
};

// 三个订阅者subscribers
var sub1 = {
    update() {
        console.log('sub1');
    }
};
var sub2 = {
    update() {
        console.log('sub2');
    }
};
var sub3 = {
    update() {
        console.log('sub3');
    }
};

// 一个主题对象(中介者)
function Dep() {
    this.subs = [sub1, sub2, sub3];
}
Dep.prototype.notify = function() {
    this.subs.forEach(sub => {
        sub.update();
    });
};

// 发布者发布消息, 主题对象执行notify方法, 进而触发订阅者执行update方法
var dep = new Dep();
pub.publish();
// 'sub1', 'sub2', 'sub3'
