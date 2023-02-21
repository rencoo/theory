import b from "./b.mjs"
export default function () {
  console.log("in a.mjs function")
}
console.log('before execute b')
b()
