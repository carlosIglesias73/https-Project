require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Importar rutas
const authRoutes = require('./src/routes/auth.routes');
const initRoutes = require('./src/routes/init.routes');

// Conexión a MySQL
const db = require('./src/config/database');

const app = express();

// ✅ CRÍTICO: Confiar en proxies (Vercel/Railway usan X-Forwarded-For)
app.set('trust proxy', 1);

// ✅ CORS DEBE IR ANTES DE HELMET Y OTROS MIDDLEWARES
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://auth-frontend-rosy.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('🌐 Orígenes permitidos:', allowedOrigins);

// ✅ CONFIGURACIÓN CORS MEJORADA
app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origin (como Postman, o same-origin)
    if (!origin) {
      return callback(null, true);
    }
    
    // En desarrollo, permitir cualquier origen
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Modo desarrollo - origen permitido:', origin);
      return callback(null, true);
    }
    
    // En producción, verificar lista de orígenes
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origen permitido:', origin);
      return callback(null, true);
    }
    
    console.log('❌ Origen rechazado:', origin);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true, // ✅ CRÍTICO para cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // Cache preflight por 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// ✅ CABECERAS DE SEGURIDAD con Helmet (DESPUÉS de CORS)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }, // ✅ Importante para CORS
  xFrameOptions: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Middlewares de parseo
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ✅ RATE LIMITING
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting específico para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  message: { message: 'Demasiados intentos de login, intenta de nuevo en 15 minutos.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ LOGGING MEJORADO
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    console.log('Origin:', req.headers.origin);
    console.log('Cookies:', req.cookies);
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

// ✅ Rutas API (después de middlewares)
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/init', initRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Endpoint no encontrado',
    path: req.path 
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  // Error de CORS
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({
      message: 'Acceso no permitido por CORS',
      origin: req.headers.origin
    });
  }
  
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

// Levantar servidor
const port = process.env.PORT || 4000;
const server = app.listen(port, '0.0.0.0', () => {
  const address = server.address();
  console.log(`🚀 API Backend ejecutándose en http://localhost:${port}`);
  console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🌐 Escuchando en: ${address.address}:${address.port}`);
  console.log(`🔒 HTTPS: ${process.env.NODE_ENV === 'production' ? 'Manejado por Vercel' : 'Deshabilitado (desarrollo)'}`);
  console.log(`✅ Trust proxy: ${app.get('trust proxy')}`);
  console.log(`✅ CORS configurado para: ${allowedOrigins.join(', ')}`);
});

module.exports = app;