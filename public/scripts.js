console.log(`==================== Sanity Check For scripts.js ====================`);
// Globals
// 1. The socket variable is used to store the server connection
let socket = null;
// 2. The device variable is used to store the device media information
let device = null;
// 3 localtream variable is used to store the video and audio stream
let localStream = null;
// 4. the producerTransport variable
let producerTransport = null;
//===================================================================================//
// Connect to the server
const initConnect = () => {
  socket = io("https://localhost:8000");
  connectButton.innerHTML = "Connecting...";
  connectButton.disabled = true;
  addSocketListeners();
};
//===================================================================================//

//===================================================================================//
// Create a mediasoup client
const deviceSetup = async () => {
  // console.log(mediasoupClient);
  device = new mediasoupClient.Device();
  // Load the device
  const routerRtpCapabilities = await socket.emitWithAck("getRtpCap");
  await device.load({ routerRtpCapabilities });
  // console.log(routerRtpCapabilities);
  // console.log(device.loaded);
  // disable "Init Connect" button
  deviceButton.disabled = true;
  // enable "Create & Load Device" button
  createProdButton.disabled = false;
};
const createProducer = async () => {
  // console.log("Create Transport!!!");
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
  producerTransport = transport;
  // the transpoty connect event will not fire until
  // we call the producerTransport.producer()
  producerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    console.log("Transport connect has fired");
  });
  producerTransport.on("produce", async (parameters, callback, errback) => {
    console.log("Transport produce event has fired");
  });
};
//===================================================================================//

//===================================================================================//
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
