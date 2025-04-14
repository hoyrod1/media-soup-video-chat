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
//init workers, it's where our mediasoup workers will live
let workers = null;
//initMediaSoup gets medisoup ready to do its thing
initMediaSoup = async () => {
  workers = await createWorkers();
  // console.log(workers);
};

initMediaSoup(); //build our mediasoup server/sfu

httpsServer.listen(config.port);
