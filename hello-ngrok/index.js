const http  = require('http');
const ngrok = require("@ngrok/ngrok");

const server = http.createServer((req, res) => {
	res.writeHead(200);
	res.end("Hello!");
});

// Consumes authtoken from env automatically
ngrok.listen(server).then(() => {
	console.log("url:", server.tunnel.url());
});