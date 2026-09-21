const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Variables de estado global
let latestData = { raw: 0, percentage: 0, led: 0 };
let pendingToggle = false;

// 1. Endpoint que recibe la telemetría enviada por la ESP32
app.post('/api/telemetry', (req, res) => {
  try {
    const { raw, percentage, led } = req.body;
    latestData = { raw, percentage, led };

    // Responder a la ESP32 enviando si hay una orden de conmutar pendiente
    const responseCommand = { toggle: pendingToggle };
    pendingToggle = false; // Limpiar orden una vez notificada

    res.json(responseCommand);
  } catch (err) {
    res.status(400).json({ error: 'Datos inválidos' });
  }
});

// 2. Endpoint que consulta la página web para actualizar la pantalla
app.get('/api/telemetry-state', (req, res) => {
  res.json(latestData);
});

// 3. Endpoint que llama el botón de la página web para cambiar el estado del LED
app.post('/api/toggle-led', (req, res) => {
  pendingToggle = true;
  res.json({ success: true, message: 'Orden registrada para la ESP32' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
