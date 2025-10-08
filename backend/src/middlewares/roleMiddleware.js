// src/middlewares/roleMiddleware.js

/**
 * Middleware para verificar roles de usuario
 * @param {...string} allowedRoles - Roles permitidos ('admin', 'moderator', 'user')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Autenticación requerida' 
      });
    }

    // Verificar que el usuario tenga rol asignado
    if (!req.user.role) {
      return res.status(403).json({ 
        message: 'Usuario sin rol asignado' 
      });
    }

    // Verificar si el rol del usuario está en los roles permitidos
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}`,
        userRole: req.user.role
      });
    }

    next();
  };
};

module.exports = { requireRole };