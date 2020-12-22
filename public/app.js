// const SIGNALING_SERVER_URL = 'https://signal-7lz3zezpea-ew.a.run.app/';
const SIGNALING_SERVER_URL = 'http://localhost:8090';
const PC_CONFIG = {};

const socket = io(SIGNALING_SERVER_URL, {
  autoConnect: false,
});

socket.on('data', (data) => {
  handleSignalingData(data);
});

socket.on('ready', (data) => {
  console.log('Ready');
  createPeerConnection();
  sendOffer();
});

let sendData = (data) => {
  socket.emit('data', data);
};

let pc;
let localStream;

const localStreamElement = document.getElementById('local-stream');
const remoteStreamElement = document.getElementById('remote-stream');

async function getLocalStream() {
  console.log('Starting media');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localStreamElement.srcObject = stream;
  localStream = stream;
}

function joinMeeting() {
  socket.connect()
}

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(PC_CONFIG);
    pc.onicecandidate = onIceCandidate;
    pc.onaddstream = onAddStream;
    pc.addStream(localStream);
    console.log('PeerConnection created');
  } catch (error) {
    console.error('PeerConnection failed: ', error);
  }
}

function sendOffer() {
  console.log('Send offer');
  pc.createOffer().then(setAndSendLocalDescription, error => {
    console.error('Send offer failed: ', error);
  });
}

function sendAnswer() {
  console.log('Send answer');
  pc.createAnswer().then(setAndSendLocalDescription, error => {
    console.error('Send answer failed: ', error);
  });
}

function setAndSendLocalDescription (sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  sendData(sessionDescription);
}

function onIceCandidate(event) {
  if (event.candidate) {
    console.log('ICE candidate', event.candidate);
    sendData({
      type: 'candidate',
      candidate: event.candidate
    });
  }
}

function onAddStream(event) {
  console.log('Add stream');
  remoteStreamElement.srcObject = event.stream;
}

function handleSignalingData(data) {
  switch (data.type) {
    case 'offer':
      createPeerConnection();
      pc.setRemoteDescription(new RTCSessionDescription(data));
      sendAnswer();
      break;
    case 'answer':
      pc.setRemoteDescription(new RTCSessionDescription(data));
      break;
    case 'candidate':
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      break;
  }
}


document.addEventListener('DOMContentLoaded', function() {
  getLocalStream();

  document.getElementById('btn-join-meeting').addEventListener('click', function() {
    joinMeeting();
  })
})
