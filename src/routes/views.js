// src/routes/views.js
const express = require('express');
const viewAuthMiddleware = require('../middlewares/viewAuthMiddleware');

const router = express.Router();

// Rutas públicas
router.get('/', (req, res) => {
  res.render('index');
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.get('/mfa', (req, res) => {
  res.render('mfa');
});

// Ruta protegida con middleware
router.get('/welcome', viewAuthMiddleware, (req, res) => {
  res.render('welcome', {
    user: req.user
  });
});

module.exports = router;