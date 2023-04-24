const cron = require('node-cron');
const axios = require('axios');
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

const thisPort = 3031;
const memoryLimitUpper = 42;
const memoryLimitLower = 41;
const serverLimit = 4;

const port = 3030;
const { spawn } = require('child_process');

let childProcesses = [];
let serverLoads;

app.post('/updateload', (req, res) => {
  serverLoads = req.body.servers;
  console.log(`Received updated server load list`);
  analyseLoad(serverLoads);
  sendServerHealthListToMainComponent(serverLoads);
  res.sendStatus(200);
});

function getPidByPort(port) {
  const childProcess = childProcesses.find(cp => cp.port === port)?.process.pid;
  return childProcess;
}

function analyseLoad(serverLoads) {
  console.log('analysing loads...');
  console.log(serverLoads)
  const hasServerBelowLimit = serverLoads.some(server => server.memoryUsage < memoryLimitUpper);
  const lowUsageServers = serverLoads.filter(server => server.memoryUsage < memoryLimitLower);

  if (hasServerBelowLimit) {
    console.log('At least one server has memory usage below limit');
    if (lowUsageServers.length > 1) {
      const s = lowUsageServers[0];
      const pid = getPidByPort(s.port);
      removeServer(s.port);
      killChildProcess(pid);
    }
    return
  }

  if (serverLoads.length >= serverLimit) {
    console.log('Server limit reached. Load is high on all machines...');
    return
  }
  console.log('All servers have memory usage above or equal to limit. Adding machine...');
  addServer();
}

async function fetchServerList() {
    try {
        const res = await fetch(`http://localhost:${port}/serverlist`);
        if (res.ok) {
        const serverList = await res.json();
        return serverList;
        } else {
        throw new Error(`Failed to fetch server list. Status code: ${res.status}`);
        }
    } catch (err) {
        throw new Error(`Failed to fetch server list. Error: ${err.message}`);
    }
}

const spawnChildProcess = (newPort) => {
    const childProcess = spawn('node', ['app-server.js', newPort]);
    childProcesses.push({
      process: childProcess,
      port: newPort
    });
};

const killChildProcess = (pid) => {
  const childProcess = childProcesses.find(child => child.process.pid === pid);
  childProcess.process.kill();
  delete childProcesses[childProcess];
  console.log(`Terminated child process ${pid}`);
};

async function sendServerHealthListToMainComponent(updatedServers) {
    console.log(updatedServers)
    const mainComponentUrl = 'http://localhost:3030';
    try {
      const response = await axios.post(`${mainComponentUrl}/updateservers`, { servers: updatedServers }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error(`Error updating server list: ${error}`);
    }
  }

async function removeServer(portToRemove) {
    try {
      for (let i = 0; i < serverLoads.length; i++) {
        if (serverLoads[i].port === portToRemove) {
          serverLoads.splice(i, 1);
          break;
        }
      }
      sendServerHealthListToMainComponent(serverLoads);
    } catch (err) {
      console.error(err);
    }
}

async function addServer() {
    try {
        const serverList = await fetchServerList()
        const ports = serverList.servers.map(server => server.port);
        const newPort = getNewPort(ports);
        spawnChildProcess(newPort);
        const newServer = { port: newPort, status: 'UNKNOWN' };
        serverList.servers.push(newServer);
        sendServerHealthListToMainComponent(serverList.servers);
    } catch (err) {
      console.error(err);
    }
}

function getNewPort(ports) {
  if (ports.length === 0) {
    return 3000;
  }
  const highestPort = Math.max(...ports);
  return (highestPort + 1);
}

addServer();

cron.schedule('*/5 * * * * *', async () => {
  
});

app.listen(thisPort);
console.log('Server live on port ' + thisPort + '.');