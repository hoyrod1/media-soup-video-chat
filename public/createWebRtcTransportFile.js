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
          ip: "127.0.0.1",
        },
        {
          protocol: "tcp",
          ip: "127.0.0.1",
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
