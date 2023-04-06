const net = require('node:net');
const port = 8000;
const host = '127.0.0.1';

let sockets = [];
const server = net.createServer();
server.on('connection', (sock) => {
  console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
  let nickname = 'User ' + (sockets.length + 1);
  sockets.push({ socket: sock, nickname: nickname, channel: 0, private: null });

  sock.write(`Your nickname is ${nickname}`);

  sock.on('data', (data) => {
    const d = new Date();
    let time = d.toLocaleTimeString().slice(0,5);
    const message = JSON.parse(data);

    sockets.forEach(function(c, index, array) {
      if (sock === c.socket) {
        nickname = c.nickname;
      }
    });

    if (message.text.substring(0,4) === 'name') {
      sockets.forEach(function(c, index, array) {
        if (sock === c.socket) {
          c.nickname = message.text.substring(5);
          sock.write(`Your nickname is now ${c.nickname}`);
        }
      });
    } else if (message.text === 'users') {
      sock.write('Connected users:\n');
      sockets.forEach(function(c, index, array) { 
        if (c.socket !== sock)  {
          sock.write(`${c.nickname}\n`);
        }
      });

    } else if (message.text.substring(0,2) === 'pc') {
      if (message.text.length === 2) {
        sockets.forEach(function(c, index, array) {
          if (sock === c.socket) {
            c.private = null;
            c.socket.write(`Exited private chat. Now on channel ${c.channel}`);
          }
        });
      } else {
        sockets.forEach(function(c, index, array) {
        if (sock === c.socket) {
            c.private = message.text.substring(3);
            c.socket.write(`You are now chatting privately with ${c.private}`);
          }
        });
      }
    } else {
      sockets.forEach(function(c, index, array) {
        if (sock === c.socket) {
            c.channel = message.channel;
            pc = c.private;
        }
      });
      console.log('DATA ' + sock.remoteAddress + ': ' + message.text);
      //console.log(sockets);
      
      sockets.forEach(function(c, index, array) {
        if (pc === null && c.socket !== sock && c.channel === message.channel)  {
            c.socket.write(`(${time}) ${nickname}: ${message.text}`);
            //sock.write(sock.remoteAddress + ':' + sock.remotePort + " said " + data + '\n');
        } else if (pc === c.nickname) {
          c.socket.write(`(${time}) (Private) ${nickname}: ${message.text}`);
        }
      });
    }
  });

  sock.on('close', (data) => {
    let index = sockets.findIndex((o) => {
      return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
    })
    if (index !== -1) sockets.splice(index, 1);
    console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);

    sockets.forEach(function(c, index, array) {
      c.socket.write(`${nickname} left the chat.`);
    });
  });

});
server.on('error', (err) => {
  throw err;
});
server.listen(port, host, () => {
  console.log('TCP Server live on port ' + port + '.');
});