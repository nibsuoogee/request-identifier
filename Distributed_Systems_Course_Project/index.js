const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
const axios = require('axios');
const port = 3030;

let serverList = []

let server;
const handler = async (req, res) => {
    const { method, url, headers, body: data } = req;
    server = getNextServer(serverList);
    try {
        const response = await axios({
            url: `http://localhost:${server}${url}`,
            method,
            headers,
            data
        })
        console.log(`proxy to ${server} succeded`);
        res.send(response.data)
    }
    catch (err) {
        console.log(`proxy to ${server} failed`);
    }
}

function getNextServer(serverList) {
    if (serverList.length < 1) {
        return null
    }
    let lowestUsage = 0;
    for (let i = 0; i < serverList.length; i++) {
        if (serverList[i].status !== 'HEALTHY') {
            continue;
        }
        if (typeof serverList[i].memoryUsage !== 'undefined') {
            if (serverList[i].memoryUsage < serverList[lowestUsage].memoryUsage) {
                lowestUsage = i;
            }
        }
    } 
    return serverList[lowestUsage].port;
  }

app.get('/serverlist', (req, res) => {
    console.log(`Server list request received.`);
    const serverListJSON = JSON.stringify({ servers: serverList });
    res.setHeader('Content-Type', 'application/json');
    res.send(serverListJSON);
})

app.get('/healthyserverlist', (req, res) => {
    console.log(`Healthy server list request received.`);
    const healthyServers = serverList.filter(server => server.status === 'HEALTHY');
    const serverListJSON = JSON.stringify({ servers: healthyServers });
    res.setHeader('Content-Type', 'application/json');
    res.send(serverListJSON);
})

app.post('/serverhealth', (req, res) => {
    serverList = req.body.servers;
    console.log(`Received updated server health list:`);
    console.log(serverList);
    res.sendStatus(200);
});


app.post('/updateservers', (req, res) => {
    serverList = req.body.servers;
    console.log(`Received updated server list:`);
    console.log(serverList);
    res.sendStatus(200);
});

app.use('/', (req, res) => { handler(req, res) });

app.listen(port);
console.log('Server live on port ' + port + '.');