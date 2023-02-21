import { time } from "./counter.mjs"
setInterval(() => console.log(`time = ${time}`), 1000); // 在 counter.mjs 中，每过1次把 time 值加1，该变化在运行的时候会被外界（ main.mjs ）捕获到
