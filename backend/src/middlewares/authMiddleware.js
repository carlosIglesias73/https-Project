// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

/**
 * Middleware para proteger rutas API (JSON)
 * Verifica el token desde cookies o header Authorization
 */
const authMiddleware = async (req, res, next) => {
  let token = null;

  // ✅ 1. Intentar obtener token de cookies primero (más seguro)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback al header Authorization
  else if (req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
  }

  if (!token) {
    return res.status(401).json({ 
      message: 'Acceso denegado. Token no proporcionado.' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar usuario en la base de datos
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Usuario no encontrado o token inválido.' 
      });
    }

    // ✅ VERIFICAR SI HAY UNA SESIÓN ACTIVA
    const activeSession = await LoginLog.findByUserIdAndActive(decoded.id);
    if (!activeSession) {
      return res.status(401).json({ 
        message: 'Sesión no activa. Por favor, inicia sesión nuevamente.' 
      });
    }
    
    // Adjuntar usuario al request
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // Token expirado - cerrar sesiones activas automáticamente
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.id) {
          await LoginLog.closeAllActiveSessions(decoded.id);
        }
      } catch (closeError) {
        console.error('Error al cerrar sesiones expiradas:', closeError);
      }
      
      return res.status(401).json({ 
        message: 'Token expirado. Por favor, inicia sesión nuevamente.' 
      });
    }
    
    return res.status(401).json({ 
      message: 'Token inválido.' 
    });
  }
};

module.exports = authMiddleware;