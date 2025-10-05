// server.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRouter = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/auth', authRouter);

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(()=> console.log('Mongo connected'))
  .catch(err => console.error('Mongo error', err));

// Cargar certificados (certs/key.pem y certs/cert.pem)
const key = fs.readFileSync(path.join(__dirname, 'certs', 'key.pem'));
const cert = fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'));

// Levantar servidor HTTPS en el puerto elegido (ej: 8443)
const port = process.env.PORT || 8443;
https.createServer({ key, cert }, app)
  .listen(port, '0.0.0.0', () => {
    console.log(`HTTPS server listening on https://0.0.0.0:${port}`);
  });
