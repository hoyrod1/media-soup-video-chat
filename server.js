const fs = require("fs"); //This is required to read our keys. This is part of node.
const https = require("https"); //This is required for a secure express server. This is part of node

const express = require("express");
const app = express();
app.use(express.static("public"));

const key = fs.readFileSync("./config/cert.key");
const cert = fs.readFileSync("./config/cert.crt");
const option = { key, cert };
const httpsServer = https.createServer(option, app);

const socketio = require("socket.io");
const mediaSoup = require("mediasoup");

const config = require("./config/config");
const createWorkers = require("./createWorkers");

//set up the socketio server, listening by way of our express http
const io = socketio(httpsServer, {
  cors: [`https://localhost:${config.port}`],
});
//Initial workers, it's where our mediasoup workers will stored
let workers = null;
//Initial router declared, where our 1st router will be stored
let router = null;
//initMediaSoup gets medisoup ready to do its thing
initMediaSoup = async () => {
  workers = await createWorkers();
  // console.log(workers);
  router = await workers[0].createRouter({ mediaCodecs: config.routerMediaCodecs });
};

initMediaSoup(); //build our mediasoup server/sfu
// socketIo listener
io.on("connect", (socket) => {
  // socket is the client that just connected
  socket.on("getRtpCap", (cb) => {
    // cb is a callback to run and will send the arguments
    // back to the client
    cb(router.rtpCapabilities);
  });
});

httpsServer.listen(config.port);
