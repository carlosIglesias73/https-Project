// server.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Importar rutas
const apiRoutes = require('./src/routes/api');
const viewRoutes = require('./src/routes/views');

// Conexión a MySQL
const db = require('./src/config/database');

const app = express();

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Para leer cookies

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/auth', apiRoutes);
app.use('/', viewRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Página no encontrada',
    message: 'La página que buscas no existe.',
    redirectUrl: '/',
    redirectText: 'Volver al inicio'
  });
});

// Verificar conexión a MySQL al iniciar
db.getConnection()
  .then(() => {
    console.log('✅ Conexión a MySQL exitosa.');
  })
  .catch(err => {
    console.error('❌ Error al conectar a MySQL:', err);
    process.exit(1);
  });

// Cargar certificados SSL
const key = fs.readFileSync(path.join(__dirname, 'certs', 'key.pem'));
const cert = fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'));

// Levantar servidor HTTPS
const port = process.env.PORT || 8443;
https.createServer({ key, cert }, app)
  .listen(port, '0.0.0.0', () => {
    console.log(`🔒 HTTPS server listening on https://0.0.0.0:${port}`);
  });