// models/LoginLog.js
const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ip: { type: String, required: true },
  userAgent: { type: String },
  success: { type: Boolean, default: true },
  duration: { type: Number }, // en segundos
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  code: { type: String } // Para el código de 8 caracteres (futuro)
}, { timestamps: true });

module.exports = mongoose.model('LoginLog', loginLogSchema);