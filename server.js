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
  let thisClientProducerTransport = null;
  // socket is the client that just connected
  socket.on("getRtpCap", (acknowledgment) => {
    // acknowledgment is a callback to run and will send the arguments
    // with the streaming data capabilities, like codecs, back to the client
    acknowledgment(router.rtpCapabilities);
  });
  // create-producer-transport
  socket.on("create-producer-transport", async (acknowledgment) => {
    // create a transport, a "Producer Transport"
    thisClientProducerTransport = await router.createWebRtcTransport({
      enableUdp: true,
      enableTcp: true, // Always use UDP unless you can't
      preferUdp: true,
      listenInfos: [
        {
          protocol: "udp",
          ip: "127.0.0.1",
        },
        {
          protocol: "tcp",
          ip: "127.0.0.1",
        },
      ],
    });
    console.log(thisClientProducerTransport);
    // the clientTransportParams stores the "Producer Transport ID"
    const clientTransportParams = {
      id: thisClientProducerTransport.id,
      iceParameters: thisClientProducerTransport.iceParameters,
      iceCandidates: thisClientProducerTransport.iceCandidates,
      dtlsParameters: thisClientProducerTransport.dtlsParameters,
    };
    // the client transport parameters sent back to the client
    acknowledgment(clientTransportParams);
  });
});

httpsServer.listen(config.port);
