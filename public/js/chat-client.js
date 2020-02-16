(function() {
    const _user = prompt('Enter your username');
    let _guest = '';
    let _myVideo = {};
    let _guestVideo = {};
    let _chatBox = {};
    let _connectedUsersBox = {};
    let _inviteChatBtn = {};
    let _startVideoBtn = {};
    let _stopVideoBtn = {};
    let _send = {};
    let _socket = undefined;
    let _connectedUsers = {}

    if(_user !== null) {
        _initChatClient();
    }

    function _initChatClient() {
        $('#username-1').html(_user);
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
        _send = $('#send-btn');
    }

    function _sendInvite(event) {
        console.log(event);
        _socket.emit('invite', { invited: _guest.data('guest'), inviter: _user })
    }

    function _setupUIEvents() {
        _inviteChatBtn.click(_sendInvite);
    }


    function _handleMessage(data) {
        const messageContainer = $(`<div class="alert alert-secondary" role="alert">${data.message}</div>`)
        _chatBox.append(messageContainer);
    }

    function _handleUserConnection(data) {
        for (const user in data.users) {
            if(!!_connectedUsers[user] == false && user !== _user) {
                _addToConnectedUserBox(user);
                _connectedUsers[user] = data.users[user];
            }
        }
    }

    function _addToConnectedUserBox(user){
        const userContainer = $(`<div data-guest="${user}" class="connected-user alert alert-secondary" role="alert">${user}</div>`);
        userContainer.click((e) => {
            _guest = $(e.target)
            _connectedUsersBox.find('.connected-user').addClass('alert-secondary').removeClass('alert-primary');
            _guest.removeClass('alert-secondary').addClass('alert-primary');
        });
        _connectedUsersBox.append(userContainer);
    }

    function _handleUserDisconnection(data) {
        _connectedUsersBox.find(`[data-guest="${data.user}"]`).remove();
    }

    function _handleUserInvitation(data) {
        console.log(data);
    }

    function _setupSocketEnvets(){
        _socket.on('message', _handleMessage);
        _socket.on('user-connected', _handleUserConnection);
        _socket.on('user-disconnect', _handleUserDisconnection);
        _socket.on('user-invitation', _handleUserInvitation);
    }
})(io, $) 