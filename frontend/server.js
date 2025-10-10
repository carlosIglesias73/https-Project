const express = require('express');
const path = require('path');
const app = express();

// ✅ SERVIR ARCHIVOS ESTÁTICOS CORRECTAMENTE
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ✅ RUTAS PARA PÁGINAS HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/register.html'));
});

app.get('/mfa', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/mfa.html'));
});

app.get('/welcome', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/welcome.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Frontend server running on port ${PORT}`);
  console.log(`📁 Serviendo archivos desde: ${__dirname}`);
});

module.exports = app;