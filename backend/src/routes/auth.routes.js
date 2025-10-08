const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const validation = require('../middlewares/validation');

const router = express.Router();

// Rutas públicas con validación
router.post('/register', validation.validateRegister, authController.register);
router.post('/login', validation.validateLogin, authController.login);
router.post('/verify-mfa', validation.validateMfaCode, authController.verifyMfa);

// Rutas protegidas
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

module.exports = router;