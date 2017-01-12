var pc;     
var localMediaStream = null;      
var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

navigator.getUserMedia(
  { audio: true, video: true }, 
  gotStream, 
  function(error) { alert('Данная функция не поддерживается браузером.') }
);

function gotStream(stream) {
  document.getElementById("callButton").style.display = 'inline-block';
  document.getElementById("localVideo").src = URL.createObjectURL(stream);
  
  // для скриншота
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

socket.on('room', function (message){
    //to do написать нормально
//    var access = confirm("Ответить?");
//    if (access === false) {
//        return;
//    }
    
    message = JSON.parse(message);
    if (message.type === 'offer') {
        pc.setRemoteDescription(new SessionDescription(message));
        createAnswer();
    } else if (message.type === 'answer') {
        pc.setRemoteDescription(new SessionDescription(message));
    } else if (message.type === 'candidate') {
        var candidate = new IceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
        pc.addIceCandidate(candidate);
    }
});

function generateName() {
    var s4 = function() {
        return Math.floor(Math.random() * 0x10000).toString(16);
    };
    return s4() + "-" + s4() + "-" + s4() + "-" + s4();  
};

var id = 'Tech-' + generateName();
var room = {};

for (i = 1; i <= 10; i++) {
    room[i] = 'chatRoom_' + i;
}

//var roomData = JSON.stringify({id: id, room: room, message: 'message'});
//socket.emit('room', roomData);
    
function sendMessage(message){
    var roomData = JSON.stringify({id: id, room: room, message: message});
    socket.emit('room', roomData);
};

$(document).on('click', '#sendMessage', function(){
    socket.emit('chat message', $('#message').val());
    return false;
});

$(document).on('click', '#callButton', function(){
    createOffer(); 
    return false;
});

socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text('Ответ: ' + msg));
});

// скриншот
//var video;
//var canvas = document.getElementsByTagName('canvas');
//var screen = document.getElementById('screenshot');
//var ctx = canvas.getContext('2d');

//function snapshot() {
//  if (localMediaStream) {
//    video = document.getElementById('remoteVideo');
//    ctx.drawImage(video, 0, 0);
//    // "image/webp" для chrome, для ост. браузеров "image/png"
//    document.getElementsByTagName('img').src = canvas.toDataURL('image/png');
//  }
//}
//$(document).on('click', '#screenshot', function(){
//    console.log('click');
//    snapshot();
//    return false;
//});

//screen.addEventListener('click', snapshot, false);