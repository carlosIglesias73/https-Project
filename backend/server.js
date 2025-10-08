require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Importar rutas
const authRoutes = require('./src/routes/auth.routes');
const initRoutes = require('./src/routes/init.routes'); // 👈 NUEVO

// Conexión a MySQL
const db = require('./src/config/database');

const app = express();

// ✅ CABECERAS DE SEGURIDAD con Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  xFrameOptions: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ✅ RATE LIMITING - Prevenir ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por IP
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting específico para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 intentos de login por IP
  message: 'Demasiados intentos de login, intenta de nuevo en 15 minutos.',
  skipSuccessfulRequests: true
});

// CORS configurado correctamente
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://tu-frontend.vercel.app'
    : true, // En desarrollo permite todo
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Middlewares
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ✅ LOGGING SEGURO - No loggear datos sensibles
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const sanitizedBody = { ...req.body };
    
    // Ocultar campos sensibles en logs
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.code) sanitizedBody.code = '***';
    
    console.log(`${req.method} ${req.path}`, sanitizedBody);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'auth-api',
    env: process.env.NODE_ENV || 'development'
  });
});

// Rutas API
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Endpoint no encontrado',
    path: req.path 
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Verificar conexión a MySQL al iniciar
db.getConnection()
  .then(() => {
    console.log('✅ Conexión a MySQL exitosa.');
  })
  .catch(err => {
    console.error('❌ Error al conectar a MySQL:', err.message);
    console.log('⚠️  La aplicación continuará ejecutándose, pero algunas funciones pueden no trabajar correctamente.');
  });

// Levantar servidor HTTP (Vercel maneja HTTPS automáticamente)
const port = process.env.PORT || 4000;
const server = app.listen(port, '0.0.0.0', () => {
  const address = server.address();
  console.log(`🚀 API Backend ejecutándose en http://localhost:${port}`);
  console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🌐 Escuchando en: ${address.address}:${address.port}`);
  console.log(`🔒 HTTPS: ${process.env.NODE_ENV === 'production' ? 'Manejado por Vercel' : 'Deshabilitado (desarrollo)'}`);
  console.log(`✅ CORS habilitado para: ${process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'todos los orígenes (dev)'}`);
});

module.exports = app;