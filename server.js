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
const createWebRtcTransportFile = require("./public/createWebRtcTransportFile");

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
//--------------------------- socketIo listener ---------------------------//
io.on("connect", (socket) => {
  //----------------------------------------------------------------------//
  let thisClientProducerTransport = null;
  let thisClientProducer = null;
  let thisClientConsumerTransport = null;
  let thisClientConsumer = null;
  //----------------------------------------------------------------------//

  //-------------- socket is the client that just connected --------------//
  socket.on("getRtpCap", (acknowledgment) => {
    // acknowledgment is a callback to run and will send the arguments
    // with the streaming data capabilities, like codecs, back to the client
    acknowledgment(router.rtpCapabilities);
  });
  //-----------------------------------------------------------------------//

  //---------------------- create-producer-transport ----------------------//
  socket.on("create-producer-transport", async (acknowledgment) => {
    // create a transport, a "Producer Transport"
    const { transport, clientTransportParams } = await createWebRtcTransportFile(router);
    thisClientProducerTransport = transport;
    // the client transport parameters sent back to the client
    acknowledgment(clientTransportParams);
  });
  //-----------------------------------------------------------------------//

  //-------------------------- connect-transport --------------------------//
  socket.on("connect-transport", async (dtlsParameters, ack) => {
    // Get the dtls info from the client and finish the connection
    try {
      await thisClientProducerTransport.connect(dtlsParameters);
      ack("SUCCESS!!!");
    } catch (error) {
      // If there is an error, log it and send cak the error details
      // console.log(error);
      ack("ERROR!!!");
    }
  });
  //-----------------------------------------------------------------------//

  //-----------------------------------------------------------------------//
  socket.on("start-producing", async ({ kind, rtpParameters }, ack) => {
    // Get the "kind" and the ""rtpParameters
    try {
      thisClientProducer = await thisClientProducerTransport.produce({
        kind,
        rtpParameters,
      });
      ack(thisClientProducer.id);
    } catch (error) {
      // If there is an error, log it and send cak the error details
      // console.log(error);
      ack("ERROR!!!");
    }
  });
  //-----------------------------------------------------------------------//

  //-----------------------------------------------------------------------//

  //====================================================================================//
  //---------------------------- create-consumer-transport -----------------------------//
  socket.on("create-consumer-transport", async (acknowledgment) => {
    // create a transport, a "Producer Transport"
    const { transport, clientTransportParams } = await createWebRtcTransportFile(router);
    thisClientConsumerTransport = transport;
    // the client transport parameters sent back to the client
    acknowledgment(clientTransportParams);
  });
  //------------------------------------------------------------------------------------//

  //--------------------------- connect-consumer-transport -----------------------------//
  socket.on("connect-consumer-transport", async (dtlsParameters, ack) => {
    // Get the dtls info from the client and finish the connection
    try {
      await thisClientConsumerTransport.connect(dtlsParameters);
      ack("SUCCESS!!!");
    } catch (error) {
      // If there is an error, log it and send cak the error details
      // console.log(error);
      ack("ERROR!!!");
    }
  });
  //------------------------------------------------------------------------------------//
  //====================================================================================//

  //====================================================================================//
  socket.on("consume-media", async ({ rtpCapabilities }, ack) => {
    // This will set up the feed for our clientConsumer and
    // Send back the params the client needs to do the same
    // But first there must be a producer so we must check if there's a producer
    if (!thisClientProducer) {
      ack("There is no producer!!!");
    } else if (
      !router.canConsume({ producerId: thisClientProducer.id, rtpCapabilities })
    ) {
      ack("Can not consume!!!");
    } else {
      // There is a producer and the feed can be consumed
      thisClientConsumer = await thisClientConsumerTransport.consume({
        producerId: thisClientProducer.id,
        rtpCapabilities,
        paused: true, // This is the best way to start the consumer
      });
      // The consumerParams variable will contain the parameters to be consumed
      const consumerParams = {
        producerId: thisClientProducer.id,
        id: thisClientConsumer.id,
        kind: thisClientConsumer.kind,
        rtpParameters: thisClientConsumer.rtpParameters,
      };
      ack(consumerParams);
    }
  });
  //====================================================================================//

  //====================================================================================//
  socket.on("unpauseConsumer", async (ack) => {
    await thisClientConsumer.resume();
  });
  //====================================================================================//
});

httpsServer.listen(config.port);
