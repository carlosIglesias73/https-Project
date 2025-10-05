// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog'); // <-- Nuevo modelo
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Registro (sin cambios)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email y password requeridos' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Usuario ya existe' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ email, passwordHash, name });
    await user.save();

    res.json({ message: 'Usuario creado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// Login (modificado)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    // Generar token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    // Registrar log de inicio de sesión exitoso
    const loginLog = new LoginLog({
      userId: user._id,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      success: true
    });
    await loginLog.save();

    res.json({ token, message: 'Login exitoso', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno' });
  }
});
// Ruta protegida - ejemplo de uso real del JWT
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: req.user,
    message: '¡Bienvenido! Esta ruta está protegida por JWT.'
  });
});

module.exports = router;