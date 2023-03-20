async function doTask() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 5000);
  });
}

async function run() {
  performance.mark('startTask');
  await doTask(); // Some developer code; cost 5000ms
  performance.mark('endTask');

  performance.measure('task', 'startTask', 'endTask');
  // Log them out
  const [entry] = performance.getEntriesByName('task');
  console.log(entry); // {detail:null, duration:5008.900000035763, entryType:"measure", name:"task", startTime:122.29999995231628}
  console.log(entry.duration); // 5005.5、5000.800000011921，和doTask的耗时基本一致
}

run();
