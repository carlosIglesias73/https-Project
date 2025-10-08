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
  message: { message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting específico para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // Más intentos en desarrollo
  message: { message: 'Demasiados intentos de login, intenta de nuevo en 15 minutos.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ CORS CONFIGURADO CORRECTAMENTE
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://auth-frontend-rosy.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, curl, servidor a servidor)
    if (!origin) return callback(null, true);
    
    // En desarrollo, permitir todos
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // En producción, verificar lista blanca
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Origen bloqueado por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400 // 24 horas
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
  console.log(`✅ Trust proxy: ${app.get('trust proxy')}`);
  console.log(`✅ CORS configurado para: ${allowedOrigins.join(', ')}`);
});

module.exports = app;