const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

const net = require('node:net');
const port = 8000;
const host = '127.0.0.1';

const client = new net.Socket();
client.setEncoding('utf-8');

client.connect(port, host, () => {
    console.log('Connected');
	const message = {
        type: 'chat',
        text: ("Hello From Client " + client.address().address),
		channel: 0
	};
	const jsonMessage = JSON.stringify(message);
	client.write(jsonMessage);
});
client.on('data', (data) => {
    console.log(data);
});
client.on('close', () => {
    console.log('Connection closed');
});
client.on('error', (err) => {
  throw err;
});
let channel = 0;
readline.on('line', (input) => {
    if (!isNaN(input)) {
        channel = parseInt(input);
        console.log(`Now on channel ${channel}`);
    }
    
    const message = {
        type: 'chat',
        text: input,
		channel: channel
	};
	const jsonMessage = JSON.stringify(message);
	client.write(jsonMessage);
	readline.prompt();
    if (message.text === 'dc') {
        client.end();
        return;
    }
});