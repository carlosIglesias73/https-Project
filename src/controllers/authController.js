// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

const authController = {
  // Registro de usuario
  register: async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email y password requeridos' });
      }

      const existing = await User.findByEmail(email);
      if (existing) {
        return res.status(409).json({ message: 'Usuario ya existe' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await User.create({ email, passwordHash, name });

      res.json({ message: 'Usuario creado exitosamente' });
    } catch (err) {
      console.error('Error en register:', err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  // Login - Paso 1: Enviar código MFA
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      // Generar código MFA (8 caracteres alfanuméricos)
      const mfaCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Registrar intento de login
      const logId = await LoginLog.create({
        userId: user.id,
        ip: req.ip || req.connection.remoteAddress || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'Unknown',
        success: false,
        code: mfaCode
      });

      // Enviar código por correo
      await emailService.sendMfaCode(user.email, mfaCode);

      res.json({ 
        message: 'Código MFA enviado a tu correo', 
        logId 
      });
    } catch (err) {
      console.error('Error en login:', err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  // Verificación MFA - Paso 2: Validar código y generar JWT
  verifyMfa: async (req, res) => {
    try {
      const { logId, code } = req.body;

      if (!logId || !code) {
        return res.status(400).json({ message: 'Log ID y código requeridos' });
      }

      const log = await LoginLog.findById(logId);
      if (!log || log.code !== code) {
        return res.status(401).json({ message: 'Código inválido' });
      }

      // Obtener usuario
      const user = await User.findById(log.user_id);
      
      // Generar token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: '1h' }
      );

      // Actualizar log como exitoso
      await LoginLog.updateSuccess(log.id);
      
      // Actualizar última fecha de login
      await User.updateLastLogin(user.id);

      // Enviar token también como cookie (más seguro para navegación)
      res.cookie('token', token, {
        httpOnly: true,
        secure: true, // Solo HTTPS
        maxAge: 3600000, // 1 hora
        sameSite: 'strict'
      });

      res.json({ 
        token, 
        message: 'Autenticación exitosa',
        userId: user.id 
      });
    } catch (err) {
      console.error('Error en verifyMfa:', err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  // Cerrar sesión
  logout: async (req, res) => {
    try {
      const activeLog = await LoginLog.findByUserIdAndActive(req.user.id);

      if (activeLog) {
        await LoginLog.updateLogout(activeLog.id);
      }

      // Limpiar cookie
      res.clearCookie('token');

      res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (err) {
      console.error('Error en logout:', err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  // Obtener información del usuario actual
  me: async (req, res) => {
    try {
      res.json({
        user: req.user,
        message: 'Usuario autenticado correctamente'
      });
    } catch (err) {
      console.error('Error en me:', err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

module.exports = authController;