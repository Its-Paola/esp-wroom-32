const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let espSocket = null;
let latestData = { raw: 0, percentage: 0, led: 0 };

wss.on('connection', (ws, req) => {
  const pathname = req.url;

  if (pathname === '/ws/esp32') {
    console.log('--- ESP32 Conectado vía WebSocket ---');
    espSocket = ws;

    ws.on('message', (message) => {
      try {
        latestData = JSON.parse(message.toString());
        // Retransmitir en tiempo real a los navegadores
        wss.clients.forEach((client) => {
          if (client !== espSocket && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'telemetry', data: latestData }));
          }
        });
      } catch (e) {
        console.error('Error parseando JSON de ESP32:', e);
      }
    });

    ws.on('close', () => {
      console.log('ESP32 Desconectado');
      espSocket = null;
    });

  } else if (pathname === '/ws/client') {
    console.log('--- Cliente Web Conectado ---');
    // Enviar datos actuales al conectar
    ws.send(JSON.stringify({ type: 'telemetry', data: latestData }));

    ws.on('message', (message) => {
      try {
        const cmd = JSON.parse(message.toString());
        if (cmd.action === 'toggle' && espSocket && espSocket.readyState === WebSocket.OPEN) {
          espSocket.send(JSON.stringify({ action: 'toggle' }));
        }
      } catch (e) {
        console.error('Error parseando comando Web:', e);
      }
    });
  }
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor WebSocket activo en puerto ${PORT}`);
});
