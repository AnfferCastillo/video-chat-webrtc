(function () {
    const _user = prompt('Enter your username');
    let _guest = '';
    let _myVideo = {};
    let _guestVideo = {};
    let _chatBox = {};
    let _connectedUsersBox = {};
    let _inviteChatBtn = {};
    let _startVideoBtn = {};
    let _stopVideoBtn = {};
    let _sendBtn = {};
    let _socket = undefined;
    let _connectedUsers = {};
    let _acceptBtn = {};
    let _rejectBtn = {};
    let _invitationText = {};
    let _usernameLabel =  $('#username-label');
    let _guestnameLabel = $('#guestname-label');
    let _room = '';
    let _chatRoomLabel = $('#chat-room');

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
        _myVideo = $('#my-video');
        _guestVideo = $('#guest-video');
        _stopVideoBtn = $('#stop-video');
        _startVideoBtn = $('#start-video');
        _inviteChatBtn = $('#invite-chat');
        _connectedUsersBox = $('#connected-users-box');
        _chatBox = $('#chat-box');
        _chatInput = $('#chat-input');
        _sendBtn = $('#send-btn');
        _acceptBtn = $('#accept-btn');
        _rejectBtn = $('#reject-btn');
        $('#invitation-modal').modal({ show: false});
        _invitationText = $('#invitation-text');
    }

    function _sendInvite(event) {
        _socket.emit('invite', { invited: _guest, inviter: _user });
    }

    function _joinRoom(room) {
        _room = room;
        _socket.emit('join-room', { room: room });
        _chatRoomLabel.html(room);
    }

    function _answerInvite(event) {
        if (event.target.id == 'accept-btn') {
            _socket.emit('invitation-accepted', { invited: _user, inviter: _guest }, (room) => _chatRoomLabel.html(room));
            _guestnameLabel.html(_guest);
        } else {
            _socket.emit('invitation-rejected', { invited: _user, inviter: _guest });
        }
        $('#invitation-modal').modal('hide');
    }

    function _sendMessage(){
        if(!!_chatInput.val()) {
            _socket.emit('message', {to: _guest, message: _chatInput.val() }, _handleMessage)
            _chatInput.val('');
        }
    }

    function _setupUIEvents() {
        _inviteChatBtn.click(_sendInvite);
        _acceptBtn.click(_answerInvite);
        _rejectBtn.click(_answerInvite);
        _sendBtn.click(_sendMessage);
    }


    function _handleMessage({to, message}) {
        const messageContainer = $(`<div class="alert ${to != _user ? 'alert-primary text-right' :'alert-secondary'}" role="alert">${message}</div>`)
        _chatBox.append(messageContainer);
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

    function _handleUserInvitation(data) {
        _invitationText.html(`${data.user} quiere chatear contigo`);
        $('#invitation-modal').modal('show');
        _guest = data.user;
    }

    function _handleInvitationAnswerYes(data){
        _guestnameLabel.html(_guest);
        _joinRoom(data.room);
    }

    function _handleInvitationAnswerNo(data){
        alert(`${_guest} rechazo tu unvitacion`);
    }

    function _setupSocketEnvets() {
        _socket.on('message', _handleMessage);
        _socket.on('user-connected', _handleUserConnection);
        _socket.on('user-disconnect', _handleUserDisconnection);
        _socket.on('user-invitation', _handleUserInvitation);
        _socket.on('invitation-answer-yes', _handleInvitationAnswerYes);
        _socket.on('invitation-answer-no', _handleInvitationAnswerNo);
    }
})(io, $) 