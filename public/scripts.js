console.log(`==================== Sanity Check For scripts.js ====================`);
//===================================================================================//
// Globals
// 1. The socket variable is used to store the server connection
let socket = null;
// 2. The device variable is used to store the device media information
let device = null;
// 3 localtream variable is used to store the video and audio stream
let localStream = null;
// 4. the producerTransport variable will store the data retrieved from the server
// to send back to the server
let producerTransport = null;
// 5. the producer variable contains the video tack information
let producer = null;
// 6. the consumerTransport will consume the data sent to the server by the producer
let consumerTransport = null;
// 7. The consumer variable contains the video track information from the producer
let consumer = null;
//===================================================================================//

//=================================== initConnect ===================================//
// Connect to the server
const initConnect = () => {
  socket = io("https://localhost:8000");
  connectButton.innerHTML = "Connecting...";
  connectButton.disabled = true;
  addSocketListeners();
};
//===================================================================================//

//=================================== deviceSetup ===================================//
// Create a mediasoup client
const deviceSetup = async () => {
  device = new mediasoupClient.Device();
  // Load the device
  const routerRtpCapabilities = await socket.emitWithAck("getRtpCap");
  await device.load({ routerRtpCapabilities });
  // disable "Init Connect" button
  deviceButton.disabled = true;
  // enable "Create & Load Device" button
  createProdButton.disabled = false;
};
//==================================================================================//

//================================= createProducer =================================//
const createProducer = async () => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    localVideo.srcObject = localStream;
  } catch (err) {
    console.log("(GUM) Get User Media error", err);
  }
  // If there is no errors
  // The data variable stores the information retrieved
  // from the "transport" information from the socket.io (signaling) server
  const data = await socket.emitWithAck("create-producer-transport");
  // console.log(data);
  const { id, iceParameters, iceCandidates, dtlsParameters } = data;
  // make a transport on the client, from the (producer)
  const transport = device.createSendTransport({
    id,
    iceParameters,
    iceCandidates,
    dtlsParameters,
  });
  //-------------------------------------------------------------------------------//

  //-------------------------------------------------------------------------------//
  producerTransport = transport;
  //-------------------------------------------------------------------------------//
  // the transpoty connect event will not fire until
  // we call the producerTransport.producer()
  producerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    // console.log("Transport connect has fired");
    // This connection comes with the local "dtlsParameters" info
    // We need to send the "dtlsParameters" back up to the server
    // This will complete the connection
    // console.log(dtlsParameters);
    const resp = await socket.emitWithAck("connect-transport", { dtlsParameters });
    if (resp === "SUCCESS!!!") {
      // If the connection succeds the "callback()" function will be called
      // This lets the applocation know to trigger the "produce" event
      callback();
    } else if ("ERROR!!!") {
      // If the connection fails the "errback()" function will be called
      // This lets the applocation know not to trigger the "produce" event
      errback();
    }
  });
  //-------------------------------------------------------------------------------//

  //-------------------------------------------------------------------------------//
  producerTransport.on("produce", async (parameters, callback, errback) => {
    // console.log("Transport produce event has fired");
    // console.log(parameters);
    const { kind, rtpParameters } = parameters;
    const resp = await socket.emitWithAck("start-producing", { kind, rtpParameters });
    if (resp === "ERROR!!!") {
      // Something went wrong when trying to produce
      errback();
    } else {
      // The "resp" contains the id
      callback({ id: resp });
    }
    // console.log(resp);
    // disable "Publish Feed" button
    publishButton.disabled = true;
    // disable "Create Consumer Transport" button
    createConsButton.disabled = false;
  });
  //-------------------------------------------------------------------------------//

  //-------------------------------------------------------------------------------//
  // disable "Create & Load Device" button
  createProdButton.disabled = true;
  // enable "Publish Feed" button
  publishButton.disabled = false;
};
//===================================================================================//

//===================================== publish =====================================//
const publish = async () => {
  const track = localStream.getVideoTracks()[0];
  producer = await producerTransport.produce({ track });
  console.log(producer);
};
//===================================================================================//

//================================== createConsume ==================================//
const createConsumer = async () => {
  // Ask the socket.io (signaling) server for transport information
  const data = await socket.emitWithAck("create-consumer-transport");
  // console.log(data);
  const { id, iceParameters, iceCandidates, dtlsParameters } = data;
  // make a transport on the client, from the (producer)
  const transport = device.createRecvTransport({
    id,
    iceParameters,
    iceCandidates,
    dtlsParameters,
  });
  //-------------------------------------------------------------------------------//

  //-------------------------------------------------------------------------------//
  consumerTransport = transport;
  //-------------------------------------------------------------------------------//
  // the transport connect event will not fire until
  // we call the transport.consume()
  consumerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    // console.log("Transport connect has fired");
    // This connection comes with the local "dtlsParameters" info
    // We need to send the "dtlsParameters" back up to the server
    // This will complete the connection
    // console.log(dtlsParameters);
    const resp = await socket.emitWithAck("connect-consumer-transport", {
      dtlsParameters,
    });
    if (resp === "SUCCESS!!!") {
      // If the connection succeds the "callback()" function will be called
      // This lets the applocation know to trigger the "produce" event
      callback();
    } else if ("ERROR!!!") {
      // If the connection fails the "errback()" function will be called
      // This lets the applocation know not to trigger the "produce" event
      errback();
    }
  });
  //-------------------------------------------------------------------------------//
  console.log(consumerTransport);
  // disable "Create Consumer Transport" button
  createConsButton.disabled = true;
  // enable "Consume Feed" button
  consumeButton.disabled = false;
};
//===================================================================================//

//===================================================================================//
const consume = async () => {
  console.log("Start Comsuming");
};
//===================================================================================//

//================================ addSocketListners ================================//
// Socket Listeners runs when the connect button is clicked
// and the eventhandler runs the "initConnect" arrow function above
function addSocketListeners() {
  socket.on("connect", () => {
    // This will auto trigger, once we are connected
    // Once device is connect to the server disable "Init Connect" button
    deviceButton.disabled = false;
    // Then change the text "Init Connect" to "Connected"
    connectButton.innerHTML = "Connected";
  });
}
