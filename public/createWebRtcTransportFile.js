console.log(
  `==================== Sanity Check For createWebRtcTransportFile.js ====================`
);
const createWebRtcTransportFile = (router) =>
  new Promise(async (resolve, reject) => {
    // createWebRtcTransportFile
    // create a transport
    const transport = await router.createWebRtcTransport({
      enableUdp: true,
      enableTcp: true, // Always use UDP unless you can't
      preferUdp: true,
      listenInfos: [
        {
          protocol: "udp",
          ip: "0.0.0.0",
          announcedAddress: "192.168.1.208",
        },
        {
          protocol: "tcp",
          ip: "0.0.0.0",
          announcedAddress: "192.168.1.208",
        },
      ],
    });
    // console.log(transport);
    // the clientTransportParams stores the "Transport ID"
    const clientTransportParams = {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
    resolve({ transport, clientTransportParams });
  });

module.exports = createWebRtcTransportFile;
