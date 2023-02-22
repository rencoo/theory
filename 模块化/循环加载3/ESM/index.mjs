import * as a from './a.mjs'
console.log('入口模块引用a模块：', a)

// b模块引用a模块： [Module] { a: <uninitialized> }
// a模块引用b模块： [Module] { b: '修改值-b模块内变量' }
// 入口模块引用a模块： [Module] { a: '修改值-a模块内变量' }