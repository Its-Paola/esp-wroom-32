const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

let latestTelemetry = { percentage: 0, raw: 0, led: 0 };

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Handle telemetry incoming from ESP32
      if (data.type === 'telemetry') {
        latestTelemetry = data;
        // Broadcast telemetry to all connected web interfaces
        broadcast({ type: 'telemetry_update', data: latestTelemetry });
      }

      // Handle commands coming from Web Dashboard
      if (data.type === 'command') {
        // Relay command to ESP32
        broadcast({ type: 'command', action: data.action });
      }
    } catch (err) {
      console.error('Error processing WS message:', err);
    }
  });

  // Send current state immediately upon web client connection
  ws.send(JSON.stringify({ type: 'telemetry_update', data: latestTelemetry }));
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
