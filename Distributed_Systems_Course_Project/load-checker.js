const cron = require('node-cron');
const fetch = require('node-fetch');
const axios = require('axios');
const port = 3030;

cron.schedule('*/2 * * * * *', async () => {
  try {
    const serverList = await fetchHealthyServerList();
    const serverLoadList = await checkAllHealthyServerLoad(serverList);
    console.log('Server load list:', serverLoadList);
    await sendServerLoadList(serverLoadList);
  } catch (err) {
    console.error('Error checking server health:', err);
  }
});

async function fetchHealthyServerList() {
  try {
    const res = await fetch(`http://localhost:${port}/healthyserverlist`);
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

async function checkServerLoad(server) {
  return new Promise(resolve => {
    fetch(`http://localhost:${server.port}/load`)
        .then(response => response.json())
        .then(data => {
        server.memoryUsage = data.memoryUsage;
        resolve(server);
    })
    .catch(error => {
        console.log('Unable to fetch connection count');
        server.memoryUsage = 'UNKNOWN';
        resolve(server);
    });
  });
}

async function checkAllHealthyServerLoad(serverList) {
  const results = await Promise.all(serverList.servers.map(checkServerLoad));
  return results;
}

async function sendServerLoadList(serverLoadList) {
  const autoscaleUrl = 'http://localhost:3031';
  try {
    const response = await axios.post(`${autoscaleUrl}/updateload`, { servers: serverLoadList }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(`Error updating server list: ${error}`);
  }
}
