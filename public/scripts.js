console.log(`==================== Sanity Check For scripts.js ====================`);
// Globals
let socket = null;
let device = null;
// Connect to the server
const initConnect = () => {
  socket = io("https://localhost:8000");
  connectButton.innerHTML = "Connecting...";
  connectButton.disabled = true;
  addSocketListeners();
};
// Create a mediasoup client
const deviceSetup = async () => {
  // console.log(mediasoupClient);
  device = new mediasoupClient.Device();
  // Load the device
  const routerRtpCapabilities = await socket.emitWithAck("getRtpCap");
  await device.load({ routerRtpCapabilities });
  // console.log(routerRtpCapabilities);
  // console.log(device.loaded);
};

// Socket Listeners
function addSocketListeners() {
  socket.on("connect", () => {
    // This will auto trigger, once we are connected
    connectButton.innerHTML = "Connected";
    deviceButton.disabled = false;
  });
}
