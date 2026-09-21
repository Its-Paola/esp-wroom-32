const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servir archivos estáticos de la interfaz web
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Variables de estado
let latestData = { raw: 0, percentage: 0, led: 0 };
let pendingCommands = { toggle_led: false };

// --- ENDPOINT HTTP PARA LA ESP32 ---
app.post('/api/telemetry', (req, res) => {
  try {
    const { raw, percentage, led } = req.body;
    latestData = { raw, percentage, led };

    // Notificar a todos los navegadores conectados por WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'telemetry', data: latestData }));
      }
    });

    // Enviar a la ESP32 cualquier orden pendiente realizada desde la web
    const responseCommand = { toggle: pendingCommands.toggle_led };
    pendingCommands.toggle_led = false; // Limpiar comando una vez enviado

    res.json(responseCommand);
  } catch (err) {
    res.status(400).json({ error: 'Formato inválido' });
  }
});

// --- WEBSOCKET SOLO PARA NAVEGADORES WEBSOCKETS CLIENT ---
wss.on('connection', (ws) => {
  console.log('Navegador Web Conectado');
  ws.send(JSON.stringify({ type: 'telemetry', data: latestData }));

  ws.on('message', (message) => {
    try {
      const cmd = JSON.parse(message);
      if (cmd.action === 'toggle') {
        pendingCommands.toggle_led = true;
      }
    } catch (e) {
      console.error('Error al procesar mensaje cliente web:', e);
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor listo en puerto ${PORT}`);
});
