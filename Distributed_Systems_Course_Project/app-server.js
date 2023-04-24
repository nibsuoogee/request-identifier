const os = require('os');
const http = require('http');
const express = require('express');
const app = express();

const server = http.createServer(app);

const port = process.argv[2];

let activeConnections = 0;

server.on('connection', (socket) => {
    activeConnections++;
    socket.on('close', () => {
        activeConnections--;
    });
});

app.get('/', (req, res) => {
    res.send(`Hello from ${port}!`);
})

app.get('/health', (req, res) => {
    console.log(`Received health check.`)
    res.send('OK');
})

app.get('/load', (req, res) => {
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const memoryUsage = (1 - (freeMemory / totalMemory)) * 100 + Math.random() ;
    res.json({ memoryUsage });
});

app.listen(port);
console.log('Server live on port ' + port + '.');