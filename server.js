// server.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const cors = require('cors');

// Importar rutas
const authRouter = require('./routes/auth');

// Conexión a MySQL
const db = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/auth', authRouter);

// Verificar conexión a MySQL al iniciar
db.getConnection()
  .then(() => {
    console.log('✅ Conexión a MySQL exitosa.');
  })
  .catch(err => {
    console.error('❌ Error al conectar a MySQL:', err);
  });

// Cargar certificados desde la carpeta certs/
const key = fs.readFileSync(path.join(__dirname, 'certs', 'key.pem'));
const cert = fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')); // <-- Aquí estaba el error

// Levantar servidor HTTPS en el puerto elegido (ej: 8443)
const port = process.env.PORT || 8443;
https.createServer({ key, cert }, app)
  .listen(port, '0.0.0.0', () => {
    console.log(`🔒 HTTPS server listening on https://0.0.0.0:${port}`);
  });