require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

// Middleware para parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// Health check para Vercel
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'frontend',
    timestamp: new Date().toISOString()
  });
});

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

// 404 - CORREGIDO: Usar patrón de Express válido
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', 'error.html'));
});

// Para SPA routing - CORREGIDO
app.get('/:page', (req, res) => {
  const page = req.params.page;
  const validPages = ['', 'register', 'mfa', 'welcome'];
  
  if (validPages.includes(page)) {
    res.sendFile(path.join(__dirname, 'views', `${page || 'index'}.html`));
  } else {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🎨 Frontend ejecutándose en puerto ${port}`);
});

module.exports = app;