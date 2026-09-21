const express = require('express');
const path = require('path');

const app = express();

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Render Web Dashboard running on port ${PORT}`);
});
