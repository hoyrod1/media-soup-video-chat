const os = require("os"); //Operating system module. Part of node
const mediasoup = require("mediasoup");
const totalThreads = os.cpus().length; //Maximum amout of threads equal maximum amut of workers
// console.log(totalThreads);
const config = require("./config/config");

const createWorkers = () =>
  new Promise(async (resolve, reject) => {
    let workers = [];
    //for loop to create each worker
    for (let i = 0; i < totalThreads; i++) {
      const worker = await mediasoup.createWorker({
        //rtcMinPort & rtcMaxPort are arbituary ports for our traffic
        //And useful for firewall and networking rules
        rtcMinPort: config.workerSettings.rtcMiniPort,
        rtcMaxPort: config.workerSettings.rtcMaxPort,
        logLevel: config.workerSettings.logLevel,
        logTags: config.workerSettings.logTags,
      });
      worker.on("died", () => {
        //This should never happen ;)
        console.log("Worker has died");
        process.exit(1); //Kill the node program
      });
      workers.push(worker);
    }
    resolve(workers);
  });

module.exports = createWorkers;
