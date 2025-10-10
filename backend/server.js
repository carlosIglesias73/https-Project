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

// ✅ CRÍTICO: Confiar en proxies
app.set('trust proxy', 1);

// ✅ CORS 
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://auth-frontend-rosy.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('🌐 Orígenes permitidos:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'development') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    console.log('❌ Origen rechazado:', origin);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
  optionsSuccessStatus: 204
}));

// ✅ Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  xFrameOptions: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Middlewares
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
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl}`);
  console.log('📍 Path:', req.path);
  console.log('📍 Base URL:', req.baseUrl);
  console.log('📍 Original URL:', req.originalUrl);
  console.log('📍 Origin:', req.headers.origin);
  console.log('📍 Host:', req.headers.host);
  console.log('📍 X-Forwarded-Host:', req.headers['x-forwarded-host']);
  console.log('---');
  next();
});

// ✅ ENDPOINTS DE PRUEBA ESPECÍFICOS PARA DEBUG DEL PROXY
app.get('/api/proxy-test', (req, res) => {
  res.json({ 
    message: '✅ Proxy test funcionando - Ruta: /api/proxy-test',
    timestamp: new Date().toISOString(),
    requestDetails: {
      originalUrl: req.originalUrl,
      path: req.path,
      baseUrl: req.baseUrl,
      method: req.method,
      headers: {
        origin: req.headers.origin,
        host: req.headers.host,
        'x-forwarded-host': req.headers['x-forwarded-host']
      }
    },
    note: 'Esta ruta está en /api/proxy-test en el backend'
  });
});

app.get('/api/auth/proxy-test', (req, res) => {
  res.json({ 
    message: '✅ Auth proxy test funcionando - Ruta: /api/auth/proxy-test',
    timestamp: new Date().toISOString(),
    path: '/api/auth/proxy-test',
    backend: 'auth-backend-sigma-lac.vercel.app'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'auth-api',
    env: process.env.NODE_ENV || 'development',
    proxyInfo: {
      'x-forwarded-host': req.headers['x-forwarded-host'],
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
      originalUrl: req.originalUrl
    }
  });
});

// ✅ Rutas API
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/init', initRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Endpoint no encontrado en el backend',
    requestedPath: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/proxy-test', 
      'GET /api/auth/proxy-test',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/verify-mfa',
      'POST /api/auth/logout',
      'GET /api/auth/me',
      'GET /api/init/setup'
    ]
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err.message);
  
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({
      message: 'Acceso no permitido por CORS',
      origin: req.headers.origin,
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Verificar conexión a MySQL
db.getConnection()
  .then(() => {
    console.log('✅ Conexión a MySQL exitosa.');
  })
  .catch(err => {
    console.error('❌ Error al conectar a MySQL:', err.message);
  });

// Levantar servidor
const port = process.env.PORT || 4000;
const server = app.listen(port, '0.0.0.0', () => {
  const address = server.address();
  console.log(`🚀 API Backend ejecutándose en http://localhost:${port}`);
  console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
  console.log(`🔗 Proxy test: http://localhost:${port}/api/proxy-test`);
  console.log(`✅ Trust proxy: ${app.get('trust proxy')}`);
});

module.exports = app;