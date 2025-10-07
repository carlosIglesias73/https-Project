// src/middlewares/viewAuthMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

/**
 * Middleware para proteger rutas de vistas (HTML)
 * Verifica el token desde cookies o query params
 */
const viewAuthMiddleware = (req, res, next) => {
  // Intentar obtener token de diferentes fuentes
  let token = null;

  // 1. Desde cookies (más seguro)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  // 2. Desde Authorization header (si lo envían)
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
  }

  // Si no hay token, redirigir al login
  if (!token) {
    return res.status(401).render('error', {
      title: 'Acceso Denegado',
      message: 'No tienes permiso para acceder a esta página.',
      redirectUrl: '/',
      redirectText: 'Ir al Login'
    });
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Token inválido o expirado
    return res.status(401).render('error', {
      title: 'Sesión Expirada',
      message: 'Tu sesión ha expirado o es inválida.',
      redirectUrl: '/',
      redirectText: 'Iniciar Sesión'
    });
  }
};

module.exports = viewAuthMiddleware;