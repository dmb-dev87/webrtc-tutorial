const WebSocketServer = require('ws').Server;
const express = require('express');
const https = require('https');
const app = express();
const fs = require('fs');

const pkey = fs.readFileSync('./ssl/key.pem');
const pcert = fs.readFileSync('./ssl/cert.pem');
const options = {key: pkey, cert: pcert, passphrase: '123456789'};

var wss = null, sslSrv = null;

app.use(express.static('public'));

app.use(function(req, res, next) {
  if(req.headers['x-forwarded-proto']==='http') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
});

sslSrv = https.createServer(options, app).listen(443);
console.log('WebSocket Secure server is up and running.');

wss = new WebSocketServer({server: sslSrv});
console.log('WebSocket Secure server is up and running.');

// Successful connection
wss.on('connection', function(client) {
  console.log('A new WebSocket client was connected.');
  // Incomming message
  client.on('message', function(message) {
    // Broadcast message to all clents
    wss.broadcast(message, client);
  });
});

// Broadcasting the message to all WebSocket clients.
wss.broadcast = function(data, exclude) {
  var i = 0, n = this.clients? this.clients.length : 0, client = null;
  if (n < 1) {
    return;
  }
  console.log('Broadcasting message to all ' + n + ' WebSocket clients.');
  for (; i < n; i++) {
    client = this.clients[i];
    // Don't send the message to the sender...
    if (client === exclude) {
      continue;
    }
    if (client.readyState === client.OPEN) {
      client.send(data);
    } else {
      console.error('Error: the client state is ' + client.readyState);
    }
  }
};