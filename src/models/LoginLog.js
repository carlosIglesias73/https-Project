// src/models/LoginLog.js
const db = require('../config/database');

const LoginLog = {
  /**
   * Crear un nuevo registro de login
   */
  create: async ({ userId, ip, userAgent, success, code }) => {
    const query = `
      INSERT INTO login_logs (user_id, ip, user_agent, success, code)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [userId, ip, userAgent, success, code]);
    return result.insertId;
  },

  /**
   * Buscar log por ID
   */
  findById: async (id) => {
    const query = 'SELECT * FROM login_logs WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  },

  /**
   * Buscar log activo de un usuario (sin ended_at)
   */
  findByUserIdAndActive: async (userId) => {
    const query = `
      SELECT id FROM login_logs
      WHERE user_id = ? AND ended_at IS NULL
      ORDER BY started_at DESC LIMIT 1
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows[0];
  },

  /**
   * Actualizar log como exitoso después de verificar MFA
   */
  updateSuccess: async (id) => {
    const query = 'UPDATE login_logs SET success = 1 WHERE id = ?';
    await db.execute(query, [id]);
  },

  /**
   * Registrar logout (duración de sesión)
   */
  updateLogout: async (id) => {
    const query = `
      UPDATE login_logs
      SET ended_at = NOW(), duration = TIMESTAMPDIFF(SECOND, started_at, NOW())
      WHERE id = ?
    `;
    await db.execute(query, [id]);
  },

  /**
   * Obtener historial de logins de un usuario
   */
  getHistory: async (userId, limit = 10) => {
    const query = `
      SELECT id, ip, user_agent, success, started_at, ended_at, duration
      FROM login_logs
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `;
    const [rows] = await db.execute(query, [userId, limit]);
    return rows;
  }
};

module.exports = LoginLog;