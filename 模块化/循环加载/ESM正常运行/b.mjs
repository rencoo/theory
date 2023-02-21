import a from "./A.mjs"
console.log('before execute a')
a()
export default function () {
  console.log("in b.mjs function")
}
