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

  // ✅ 1. Intentar obtener token de cookies primero
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('🍪 Token encontrado en cookies');
  }
  // 2. Fallback al header Authorization
  else if (req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
      console.log('🔑 Token encontrado en header Authorization');
    }
  }

  if (!token) {
    console.log('❌ No se encontró token en cookies ni en headers');
    return res.status(401).json({ 
      message: 'Acceso denegado. Token no proporcionado.' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verificado para usuario:', decoded.email);
    
    // Buscar usuario en la base de datos
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('❌ Usuario no encontrado:', decoded.id);
      return res.status(401).json({ 
        message: 'Usuario no encontrado o token inválido.' 
      });
    }

    // ✅ VERIFICACIÓN DE SESIÓN ACTIVA - MEJORADA
    // Solo verificar si hay una sesión activa reciente (último día)
    const recentSession = await LoginLog.findRecentSession(decoded.id);
    
    if (!recentSession) {
      console.log('⚠️ No se encontró sesión reciente para usuario:', decoded.id);
      // En lugar de rechazar, permitir pero loggear
      // Esto evita problemas de sincronización entre el token y los logs
    }
    
    // Adjuntar usuario al request
    req.user = user;
    console.log('✅ Usuario autenticado:', user.email);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.log('⏰ Token expirado');
      
      // Token expirado - cerrar sesiones activas
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
    
    console.log('❌ Token inválido:', err.message);
    return res.status(401).json({ 
      message: 'Token inválido.' 
    });
  }
};

module.exports = authMiddleware;