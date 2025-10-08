// src/middlewares/validation.js
const validator = require('validator');

const validationMiddleware = {
  // ✅ Validar registro
  validateRegister: (req, res, next) => {
    const { email, password, name } = req.body;
    const errors = [];

    // Validar email
    if (!email || !validator.isEmail(email)) {
      errors.push('Email inválido');
    } else {
      // Sanitizar email
      req.body.email = validator.normalizeEmail(email);
    }

    // Validar contraseña (mínimo 8 caracteres, 1 mayúscula, 1 número)
    if (!password || password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    } else if (!validator.isStrongPassword(password, {
      minLength: 8,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0
    })) {
      errors.push('La contraseña debe contener al menos 1 mayúscula y 1 número');
    }

    // Validar nombre
    if (!name || !validator.isLength(name, { min: 2, max: 100 })) {
      errors.push('El nombre debe tener entre 2 y 100 caracteres');
    } else {
      // Sanitizar nombre (escapar HTML)
      req.body.name = validator.escape(name.trim());
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        message: 'Errores de validación', 
        errors 
      });
    }

    next();
  },

  // ✅ Validar login
  validateLogin: (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !validator.isEmail(email)) {
      errors.push('Email inválido');
    } else {
      req.body.email = validator.normalizeEmail(email);
    }

    if (!password || password.length < 1) {
      errors.push('Contraseña requerida');
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        message: 'Errores de validación', 
        errors 
      });
    }

    next();
  },

  // ✅ Validar código MFA
  validateMfaCode: (req, res, next) => {
    const { logId, code } = req.body;
    const errors = [];

    if (!logId || !validator.isInt(logId.toString())) {
      errors.push('ID de log inválido');
    }

    if (!code || !validator.isAlphanumeric(code) || code.length !== 8) {
      errors.push('Código MFA inválido (debe ser alfanumérico de 8 caracteres)');
    } else {
      // Convertir código a mayúsculas para comparación
      req.body.code = code.toUpperCase();
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        message: 'Errores de validación', 
        errors 
      });
    }

    next();
  }
};

module.exports = validationMiddleware;