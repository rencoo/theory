// import a from "./A.mjs" // 引用不存在的A.mjs也能运行，而且结果很奇怪
import a from './a.mjs';
console.log('before execute a')
a()
export default function () {
  console.log("in b.mjs function")
}
