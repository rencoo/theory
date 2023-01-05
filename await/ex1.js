const resolvedPromise = () => new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('hello world');
  }, 200);
});

const rejectedPromise = () => new Promise((resolve, reject) => {
  setTimeout(() => {
    reject(new Error('error!'));
  }, 2000);
});

function errorFn() {
  bbb();
}

(async function main() {
  const res = await errorFn();
  console.log('res', res);
})()
.then((res) => {
  console.log('then', res);
})
.catch((err) => {
  console.log('err', err);
})
.finally(() => {
  console.log('finally');
});
