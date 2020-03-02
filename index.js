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

    socket.join('default-room');
    
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

    socket.on('signaling-offer', (data) => {
        console.log('signaling-offer', data);
        socket.to('default-room').emit('signaling-offer', {...data.offer});
    });

    socket.on('signaling-answer', (data) => {
        console.log('signaling-answer', data);
        socket.to('default-room').emit('signaling-answer', {...data.answer});
    });

    socket.on('signaling-icecandidate', (data) => {
        console.log('signaling-icecandidate', data);
        socket.to('default-room').emit('signaling-icecandidate', {...data.candidate});
    });

    socket.on('message', (data, fn) => {
        socket.to('default-room').emit('message', data);
        fn(data);
    });
});

app.get('/',  (req, res) => {
    res.sendFile(__dirname + '/public/views/index.html');
}); 

http.listen(3000,  () => {
    console.log('listening on *:3000');
});