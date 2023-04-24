const cron = require('node-cron');
const fetch = require('node-fetch');
const axios = require('axios');
const port = 3030;

const unknownCounts = {};

const handleUnknownServer = (port) => {
  console.log('unknownCounts')
  console.log(unknownCounts)
  if (!unknownCounts[port]) {
    unknownCounts[port] = 1;
  } else {
    unknownCounts[port]++;
  }

  if (unknownCounts[port] >= 5) {
    console.log(`Server at port ${port} has been removed from the list due to repeated unknown status`);
    delete unknownCounts[`${port}`];
    return 1
  }
};

const checkRepeat = (serverList) => {
  for (const server of serverList.servers) {
    if (server.status === 'UNKNOWN') {
      remove = handleUnknownServer(server.port);

      if (remove) { serverList.servers = serverList.servers.filter(s => s.port !== server.port); };
      return serverList
    }
  }
  return serverList
}

cron.schedule('*/2 * * * * *', async () => {
  let remove = 0;
  try {
    let serverList = await fetchServerList();
    if (serverList.servers.length > 0) {
      serverList = checkRepeat(serverList);

      const serverHealthList = await checkAllServerHealth(serverList);
      console.log('Server health list:', serverHealthList);
      await sendServerHealthListToMainComponent(serverHealthList);
    } else {
      console.log('No healthy servers...');
    }
    

  } catch (err) {
    console.error('Error checking server health:', err);
  }
});

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

async function checkServerHealth(server) {
  return new Promise(resolve => {
    fetch(`http://localhost:${server.port}/health`)
      .then(response => {
        if (response.status === 200) {
          server.status = 'HEALTHY';
        } else {
          server.status = 'UNHEALTHY';
        }
        resolve(server);
      })
      .catch(error => {
        server.status = 'UNKNOWN';
        resolve(server);
      });
  });
}

async function checkAllServerHealth(serverList) {
  const results = await Promise.all(serverList.servers.map(checkServerHealth));
  return results;
}

async function sendServerHealthListToMainComponent(serverHealthList) {
  const mainComponentUrl = 'http://localhost:3030';
  try {
    const response = await axios.post(`${mainComponentUrl}/serverhealth`, { servers: serverHealthList }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(`Error updating server list: ${error}`);
  }
}
