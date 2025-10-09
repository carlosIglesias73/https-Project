// src/models/LoginLog.js
const db = require('../config/database');

const LoginLog = {
  /**
   * Crear un nuevo log de login
   */
  create: async ({ userId, ip, userAgent, success = false, code = null }) => {
    try {
      const query = `
        INSERT INTO login_logs (user_id, ip, user_agent, success, code) 
        VALUES (?, ?, ?, ?, ?)
      `;
      const [result] = await db.execute(query, [userId, ip, userAgent, success, code]);
      return result.insertId;
    } catch (error) {
      console.error('Error creando log:', error);
      throw error;
    }
  },

  /**
   * Buscar log por ID
   */
  findById: async (id) => {
    try {
      const query = 'SELECT * FROM login_logs WHERE id = ?';
      const [rows] = await db.execute(query, [id]);
      return rows[0];
    } catch (error) {
      console.error('Error buscando log por ID:', error);
      throw error;
    }
  },

  /**
   * Buscar log activo por usuario
   */
  findByUserIdAndActive: async (userId) => {
    try {
      const query = 'SELECT * FROM login_logs WHERE user_id = ? AND success = true AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1';
      const [rows] = await db.execute(query, [userId]);
      return rows[0];
    } catch (error) {
      console.error('Error buscando sesión activa:', error);
      throw error;
    }
  },

  /**
   * Marcar log como exitoso (SOLO éxito, sin cerrar sesión)
   */
  updateSuccess: async (id) => {
    try {
      const query = `
        UPDATE login_logs 
        SET success = true
        WHERE id = ?
      `;
      await db.execute(query, [id]);
      return true;
    } catch (error) {
      console.error('Error actualizando éxito:', error);
      throw error;
    }
  },

  /**
   * Cerrar sesión (logout manual o por expiración)
   */
  updateLogout: async (id) => {
    try {
      const query = `
        UPDATE login_logs 
        SET ended_at = NOW(),
            duration = TIMESTAMPDIFF(SECOND, started_at, NOW())
        WHERE id = ?
      `;
      await db.execute(query, [id]);
      return true;
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      throw error;
    }
  },

  /**
   * Cerrar todas las sesiones activas de un usuario (por expiración de token)
   */
  closeAllActiveSessions: async (userId) => {
    try {
      const query = `
        UPDATE login_logs 
        SET ended_at = NOW(),
            duration = TIMESTAMPDIFF(SECOND, started_at, NOW())
        WHERE user_id = ? AND success = true AND ended_at IS NULL
      `;
      await db.execute(query, [userId]);
      return true;
    } catch (error) {
      console.error('Error cerrando todas las sesiones:', error);
      throw error;
    }
  },

  /**
   * Buscar sesión reciente del usuario (últimas 24 horas)
   */
  findRecentSession: async (userId) => {
    try {
      const query = `
        SELECT * FROM login_logs 
        WHERE user_id = ? 
        AND success = true 
        AND started_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY started_at DESC 
        LIMIT 1
      `;
      const [rows] = await db.execute(query, [userId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error buscando sesión reciente:', error);
      throw error;
    }
  }
};

module.exports = LoginLog;