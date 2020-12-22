const SIGNALING_SERVER_URL = 'https://signal-7lz3zezpea-ew.a.run.app/';
// const SIGNALING_SERVER_URL = 'http://localhost:8090';
const PC_CONFIG = {};

const socket = io(SIGNALING_SERVER_URL, {
  autoConnect: false,
});

socket.on('data', data => {
  handleSignalingData(data);
});

socket.on('connect', () => {
  console.log('Connected to signal server')
});

socket.on('hello', sid => {
  console.log('Session started with ID', sid);
  socket.emit('meetingid', sessionMeetingId);
  showHappyMessage('Connected');
});

socket.on('ready', () => {
  console.log('Ready');
  createPeerConnection();
  sendOffer();
});

function sendData(data) {
  socket.emit('data', data);
};

let pc;
let localStream;
let sessionMeetingId;

const btnStartNewMeeting = document.getElementById('btn-start-meeting');
const btnJoinMeeting = document.getElementById('btn-join-meeting');
const inputDisplayMeetingId = document.getElementById('display-meeting-id');
const inputEnterMeetingId = document.getElementById('input-meeting-id');
const localStreamElement = document.getElementById('local-stream');
const remoteStreamElement = document.getElementById('remote-stream');
const happyMessageBox = document.getElementById('happy-message');
const indifferentMessageBox = document.getElementById('indifferent-message');
const sadMessageBox = document.getElementById('sad-message');

async function getLocalStream() {
  console.log('Starting media');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localStreamElement.srcObject = stream;
  localStream = stream;
}

function joinMeeting(meetingId) {
  if (! meetingId) {
    showSadMessage('Please enter a meeting ID')
    return;
  }

  showHappyMessage('Connecting');
  socket.connect();
}

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(PC_CONFIG);
    pc.onicecandidate = onIceCandidate;
    pc.onaddstream = onAddStream;
    pc.addStream(localStream);
    console.log('PeerConnection created');
    showHappyMessage('Connected');
  } catch (error) {
    console.error('PeerConnection failed: ', error);
    showSadMessage('Connection failed. ¯\\_(ツ)_/¯');
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

function generateMeetingId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const length = 9;
  const result = []

  for (let i = 0; i < length; i++) {
    if (i > 0 && i%3 == 0) {
      result.push('-')
    }
    result.push(chars.charAt(Math.floor(Math.random() * chars.length)))
  }

  return result.join('');
}

function showHappyMessage(message) {
  happyMessageBox.style.display = 'block';
  indifferentMessageBox.style.display = 'none';
  sadMessageBox.style.display = 'none';
  happyMessageBox.innerText = message;
  setTimeout(hideAllMessages, 3000);
}

function showIndifferentMessage(message) {
  happyMessageBox.style.display = 'none';
  indifferentMessageBox.style.display = 'block';
  sadMessageBox.style.display = 'none';
  indifferentMessageBox.style.innerText = message;
  setTimeout(hideAllMessages, 3000);
}

function showSadMessage(message) {
  happyMessageBox.style.display = 'none';
  indifferentMessageBox.style.display = 'none';
  sadMessageBox.style.display = 'block';
  sadMessageBox.innerText = message;
  setTimeout(hideAllMessages, 3000);
}

function hideAllMessages() {
  happyMessageBox.style.display = 'none';
  indifferentMessageBox.style.display = 'none';
  sadMessageBox.style.display = 'none';
}

function handleStartMeetingClick() {
  const meetingId = generateMeetingId();
  inputDisplayMeetingId.value = meetingId;
  joinMeeting(meetingId);
  sessionMeetingId = meetingId;
}

function handleJoinMeetingClick() {
  const meetingId = inputEnterMeetingId.value;
  joinMeeting(meetingId);
  sessionMeetingId = meetingId;
}

document.addEventListener('DOMContentLoaded', function() {
  getLocalStream();

  btnStartNewMeeting.addEventListener('click', handleStartMeetingClick);
  btnJoinMeeting.addEventListener('click', handleJoinMeetingClick);
})
