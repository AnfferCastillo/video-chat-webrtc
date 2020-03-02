(function () {
    const configuration = { 'iceServers': 
        [{ 'url': 'stun:stun01.sipphone.com' }] };
    let _peerConnection = {};
    const _user = prompt('Enter your username');
    const constraints = {
        'video': true
    }

    let _guest = '';
    let _myVideo = {};
    let _guestVideo = {};
    let _chatBox = {};
    let _connectedUsersBox = {};
    let _startVideoBtn = {};
    let _stopVideoBtn = {};
    let _sendBtn = {};
    let _socket = undefined;
    let _connectedUsers = {};
    let _usernameLabel = $('#username-label');
    let _callBtn;
    let _currentVideoStream = {};
    let _remoteVideoStream = {};
    let _stream = {};

    if (_user !== null) {
        _initChatClient();
    }

    function _initChatClient() {
        _usernameLabel.html(_user);
        _getElementReferences();
        _socket = io(`http://localhost:3000/?user=${_user}`);
        _setupSocketEnvets();
        _setupUIEvents();
    }

    function _getElementReferences() {
        _myVideo = document.getElementById('my-video');
        _guestVideo = document.getElementById('guest-video');
        _stopVideoBtn = $('#stop-video');
        _startVideoBtn = $('#start-video');
        _callBtn = $('#call-btn');
        _connectedUsersBox = $('#connected-users-box');
        _chatBox = $('#chat-box');
        _chatInput = $('#chat-input');
        _sendBtn = $('#send-btn');
    }

    function _handleMessage({ sender, message }) {
        const messageContainer = $(`<div class="alert ${sender != _user ? 'alert-primary text-right' : 'alert-secondary'}" role="alert">${message}</div>`)
        _chatBox.append(messageContainer);
    }

    function _sendMessage() {
        if (!!_chatInput.val()) {
            _socket.emit('message', { sender: _user, message: _chatInput.val() }, _handleMessage)
            _chatInput.val('');
        }
    }

    function _createPeerConnection() {
        _peerConnection = new RTCPeerConnection(configuration);
        _peerConnection.addEventListener('icecandidate', event => {
            console.log({onIceCandidate: event});
            !!event.candidate && _socket.emit('signaling-icecandidate', { candidate: event.candidate });
        });
        
        _peerConnection.addEventListener('connectionstatechange',(event) => {
            console.log({perrConnectionState:  _peerConnection.iceConnectionState});
            if (_peerConnection.iceConnectionState !== "failed" &&
                _peerConnection.iceConnectionState !== "disconnected" &&
                _peerConnection.iceConnectionState !== "closed") {
            }
          });

        _remoteVideoStream = new MediaStream();
        _guestVideo.srcObject = _remoteVideoStream;

        _peerConnection.addEventListener('track', async event => {
            console.log('ontrack', event);
            _remoteVideoStream.addTrack(event.track, _remoteVideoStream);
        });
    }

    async function _createConnectionOffer() {
        _createPeerConnection();
        const offer = await _peerConnection.createOffer({
            offerToReceiveVideo: 1
          });    
        await _peerConnection.setLocalDescription(offer);
        _peerConnection.addTrack(_currentVideoStream, _stream)
        _socket.emit('signaling-offer', { offer: offer });
            
    }

    function _captureVideo() {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                _myVideo.srcObject = stream;
                _currentVideoStream = stream.getVideoTracks()[0];
                _stream = stream;
            })
            .catch(error => {
                console.error('Error accessing media devices.', error);
            });
    }

    function _stopVideo() {
        _myVideo.srcObject = null;
        _currentVideoStream.stop();
        _stream.removeTrack(_currentVideoStream);
        _currentVideoStream = null;
    }

    function _setupUIEvents() {
        _sendBtn.click(_sendMessage);
        _startVideoBtn.click(_captureVideo);
        _stopVideoBtn.click(_stopVideo);
        _callBtn.click(_createConnectionOffer);
    }

    function _handleUserConnection(data) {
        for (const user in data.users) {
            if (!!_connectedUsers[user] == false && user !== _user) {
                _addToConnectedUserBox(user);
                _connectedUsers[user] = user;
            }
        }
    }

    function _addToConnectedUserBox(user) {
        const userContainer = $(`<div data-guest="${user}" class="connected-user alert alert-secondary" role="alert">${user}</div>`);
        userContainer.click((e) => {
            _connectedUsersBox.find('.connected-user').addClass('alert-secondary').removeClass('alert-primary');
            $(e.target).removeClass('alert-secondary').addClass('alert-primary');
            _guest = user;
        });
        _connectedUsersBox.append(userContainer);
    }

    function _handleUserDisconnection(data) {
        _connectedUsersBox.find(`[data-guest="${data.user}"]`).remove();
        delete _connectedUsers[data.user];
    }

    async function _handleSignalingAnswer(answer) {
        console.log({'_handleSignalingAnswer': answer});
        await _peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }

    async function _handleSignalingOffer(offer) {
        console.log({'_handleSignalingOffer': offer});
        _createPeerConnection();
        await _peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await _peerConnection.createAnswer();
        await _peerConnection.setLocalDescription(answer);
        _socket.emit('signaling-answer', { to: _guest, answer: answer });
    }

    async function _handleICECandidate(candidate){
        try {
            console.log({'_handleICECandidate' : candidate});
            await _peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }

    function _setupSocketEnvets() {
        _socket.on('message', _handleMessage);
        _socket.on('user-connected', _handleUserConnection);
        _socket.on('user-disconnect', _handleUserDisconnection);
        _socket.on('signaling-offer', _handleSignalingOffer);
        _socket.on('signaling-answer', _handleSignalingAnswer);
        _socket.on('signaling-icecandidate', _handleICECandidate);
    }
})(io, $) 