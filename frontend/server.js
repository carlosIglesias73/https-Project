require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// Rutas para las vistas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/mfa', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'mfa.html'));
});

app.get('/welcome', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'welcome.html'));
});

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', 'error.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🎨 Frontend ejecutándose en http://localhost:${port}`);
});

module.exports = app;