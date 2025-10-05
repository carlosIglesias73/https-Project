// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Registro
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email y password requeridos' });

    const existing = await User.findByEmail(email);
    if (existing) return res.status(409).json({ message: 'Usuario ya existe' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.create({ email, passwordHash, name });

    res.json({ message: 'Usuario creado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// routes/auth.js
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    // Registrar log de inicio de sesión exitoso
    await LoginLog.create({
      userId: user.id,
      ip: req.ip || req.connection.remoteAddress || '127.0.0.1', // Asegura una IP
      userAgent: req.get('User-Agent') || 'Unknown', // Asegura un valor
      success: true,
      code: null // Agregamos explícitamente NULL para evitar el error
    });

    res.json({ token, message: 'Login exitoso', userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// Ruta protegida
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: req.user,
    message: '¡Bienvenido! Esta ruta está protegida por JWT.'
  });
});

module.exports = router;