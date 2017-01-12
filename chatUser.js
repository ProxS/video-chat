var pc;     
var localMediaStream = null;      
var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

navigator.getUserMedia(
  { audio: true, video: true }, 
  gotStream, 
  function(error) { console.log(error) }
);

function gotStream(stream) {
  document.getElementById("callButton").style.display = 'inline-block';
  document.getElementById("localVideo").src = URL.createObjectURL(stream);
  
  localMediaStream = stream;
    
  pc = new PeerConnection(null);
  pc.addStream(stream);
  pc.onicecandidate = gotIceCandidate;
  pc.onaddstream = gotRemoteStream;
};

function createOffer() {
  pc.createOffer(
    gotLocalDescription, 
    function(error) { console.log(error) }, 
    { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
  );
};

function createAnswer() {
  pc.createAnswer(
    gotLocalDescription,
    function(error) { console.log(error) }, 
    { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
  );
};


function gotLocalDescription(description){
  pc.setLocalDescription(description);
  sendMessage(description);
};

function gotIceCandidate(event){
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  }
};

function gotRemoteStream(event){
  document.getElementById("remoteVideo").src = URL.createObjectURL(event.stream);
};

// Socket.io

var socket = io.connect('localhost:1234');

function generateName() {
    var s4 = function() {
        return Math.floor(Math.random() * 0x10000).toString(16);
    };
    return s4() + "-" + s4() + "-" + s4() + "-" + s4();  
};

var id = 'User';//-' + generateName();

socket.emit('id', id);

socket.on('speak_room', function (message){
  if (message.type === 'offer') {
    pc.setRemoteDescription(new SessionDescription(message));
    createAnswer();
  } 
  else if (message.type === 'answer') {
    pc.setRemoteDescription(new SessionDescription(message));
  } 
  else if (message.type === 'candidate') {
    var candidate = new IceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
    pc.addIceCandidate(candidate);
  }
});

$(document).on('click', '#sendMessage', function(){
    socket.emit('chat message', $('#message').val());
    $('#message').text('');
    return false;
});

$(document).on('click', '#callButton', function(){
    createOffer();
    return false;
});

socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
    console.log(msg);
});