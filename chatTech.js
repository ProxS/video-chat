var pc;        
var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
var recordedChunks = [];

navigator.getUserMedia(
  {  video: {
      mandatory: {
      minWidth: 1280,
      minHeight: 720,
      minFrameRate: 30
      }
    },
  audio: true }, 
  gotStream, 
  function(error) { console.log(error) }
);

function gotStream(stream) {
  document.getElementById("callButton").style.display = 'inline-block';
  document.getElementById("localVideo").src = URL.createObjectURL(stream);
    
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
    
  var stream = event.stream;
  var recorder = null;
    
  document.getElementById("remoteVideo").src = URL.createObjectURL(event.stream);
  
  try {
      recorder = new MediaRecorder(stream, {mimeType : "video/webm"});
  } catch (e) {
      console.error('Exception while creating MediaRecorder: ' + e);
      return;
  }

  recorder.ondataavailable = function(event) {
//      console.log(' Recorded chunk of size ' + event.data.size + "B");
      recordedChunks.push(event.data);
  };

  recorder.start(100);
};

//загрузка видео
function download() {
    var blob = new Blob(recordedChunks, {
        type: 'video/webm'
    });
    
    socket.emit('movie', blob);
//  var url = URL.createObjectURL(blob);
//  var a = document.createElement('a');
//  document.body.appendChild(a);
//  a.style = 'display: none';
//  a.href = url;
//  a.download = 'test.webm';
//  a.click();
//  window.URL.revokeObjectURL(url);
}

function generateName() {
    var s4 = function() {
        return Math.floor(Math.random() * 0x10000).toString(16);
    };
    return s4() + "-" + s4();  
};

var id = 'Tech-' + generateName();

// Socket.io

var socket = io.connect('localhost:1234');

socket.emit('id', id);

function sendMessage(message){
//  socket.emit('message', message);
    //раскоментить и убрать предыдущий emit
    socket.emit('speak_room', message);
};

socket.on('message', function (message){

  var access = confirm("Response ?");
  
  if (access === false) {
    return;    
  }
    
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

socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
    console.log(msg);
});

socket.on('leave', function(user){
    var msg = user + ' leave of room';
    $('#messages').append($('<li>').text(msg));
    console.log(msg);
    $('#remoteVideo').attr('src', '');
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

// скриншот

//$(document).on('click', '#screenshot', function(){
//    screenshot();
//    return false;
//});

function screenshot(width = 300, height = 150) {
    
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');
    video = document.getElementById('remoteVideo');
    ctx.drawImage(video, 0, 0);
    // "image/webp" для chrome, для ост. браузеров "image/png"
    dataImage = canvas.toDataURL('image/jpeg');
    $('img').val(dataImage);
    //хранит сохранненый скриншот $('img').val();
//    console.log(dataImage);
    saveImage(dataImage);
    
}

function saveImage(dataImage){
    $.ajax({
        url: '/',
        type: 'POST',
        data: dataImage,
    });
}

$(document).ready(function() {
    $('#screenshot').on('click', function(){
        screenshot(600, 300);
        return false; 
    });
    
    $('#closeConnection').on('click', function(){
        socket.emit('closeChat');
        download();
        pc = null;
        recordedChunks = [];
        location.reload();
    });
});