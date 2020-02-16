const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
let connectedUsers = {};

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    
    console.log(`${socket.handshake.query.user} on socket: ${socket.id}`);
    if(!!connectedUsers[socket.handshake.query.user] === false) {
        connectedUsers[socket.handshake.query.user] = socket.id;
    }
    
    io.emit('user-connected', { users: connectedUsers })

    socket.on('disconnect', () => {
        console.log(`user ${socket.id} is gone`);
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
        console.log(data);
        socket.to(connectedUsers[data.invited]).emit('user-invitation', { user: data.inviter });
    })

    socket.on('message', (data) => {
        console.log(data.message);
    })
});

app.get('/',  (req, res) => {
    res.sendFile(__dirname + '/public/views/index.html');
}); 

http.listen(3000,  () => {
    console.log('listening on *:3000');
});