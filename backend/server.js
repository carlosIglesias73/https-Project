require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importar rutas
const authRoutes = require('./src/routes/auth.routes');
const initRoutes = require('./src/routes/init.routes'); // 👈 Nueva ruta

// Conexión a MySQL
const db = require('./src/config/database');

const app = express();

// Configuración de CORS - MUY PERMISIVA para desarrollo
const corsOptions = {
  origin: true, // Permitir TODOS los orígenes en desarrollo
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'auth-api',
    env: process.env.NODE_ENV
  });
});

// Rutas API
app.use('/api/auth', authRoutes);
//app.use('/api/init', initRoutes); // 👈 Registrar ruta de inicialización

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Endpoint no encontrado',
    path: req.path 
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Verificar conexión a MySQL al iniciar (pero no crashear si falla)
db.getConnection()
  .then(() => {
    console.log('✅ Conexión a MySQL exitosa.');
  })
  .catch(err => {
    console.error('❌ Error al conectar a MySQL:', err.message);
    console.log('⚠️  La aplicación continuará ejecutándose, pero algunas funciones pueden no trabajar correctamente.');
    // NO usar process.exit(1) para que la app pueda servir el endpoint de inicialización
  });

// Levantar servidor HTTP
const port = process.env.PORT || 4000;
const server = app.listen(port, '0.0.0.0', () => {
  const address = server.address();
  console.log(`🚀 API Backend ejecutándose en http://localhost:${port}`);
  console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🌐 Escuchando en: ${address.address}:${address.port}`);
  console.log(`✅ CORS habilitado para todos los orígenes (development mode)`);
});

module.exports = app;