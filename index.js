const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const connectedUsers = {};
const chatRooms = {};

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    
    console.log(`${socket.handshake.query.user} on socket: ${socket.id}`);
    if(!!connectedUsers[socket.handshake.query.user] === false) {
        connectedUsers[socket.handshake.query.user] = socket.id;
    }
    
    io.emit('user-connected', { users: connectedUsers })

    socket.on('disconnect', () => {
        let user = '';
        for(const username in connectedUsers){
            if(connectedUsers[username] === socket.id){
                user = username;
                delete connectedUsers[username];
            }
        }
        io.emit('user-disconnect', {user: user})
    });

    socket.on('invite', (data) => {
        socket.to(connectedUsers[data.invited]).emit('user-invitation', { user: data.inviter });
    });

    socket.on('invitation-accepted', (data, fn) => {
        const room = new Date().getTime();
        chatRooms[room] = {
            user1: data.invited,
            user2: data.inviter
        };
        socket.join(room);
        socket.to(connectedUsers[data.inviter]).emit('invitation-answer-yes', {room: room});
        fn(room);
    });

    socket.on('invitation-rejected', (data) => {
        socket.to(connectedUsers[data.inviter]).emit('invitation-answer-no');
    });

    socket.on('join-room', (data) => {
        socket.join(data.room);
    });

    socket.on('message', (data, fn) => {
        socket.to(connectedUsers[data.to]).emit('message', data);
        fn(data);
    });
});

app.get('/',  (req, res) => {
    res.sendFile(__dirname + '/public/views/index.html');
}); 

http.listen(3000,  () => {
    console.log('listening on *:3000');
});