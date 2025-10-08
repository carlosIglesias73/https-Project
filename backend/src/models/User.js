// src/models/User.js
const db = require('../config/database');

const User = {
  /**
   * Crear un nuevo usuario
   */
  create: async ({ email, passwordHash, name }) => {
    const query = 'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)';
    const [result] = await db.pool.execute(query, [email, passwordHash, name]);
    return result.insertId;
  },

  /**
   * Buscar usuario por email
   */
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await db.pool.execute(query, [email]);
    return rows[0];
  },

  /**
   * Buscar usuario por ID
   */
  findById: async (id) => {
    const query = 'SELECT id, email, name, last_login, created_at FROM users WHERE id = ?';
    const [rows] = await db.pool.execute(query, [id]);
    return rows[0];
  },

  /**
   * Actualizar última fecha de login
   */
  updateLastLogin: async (id) => {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = ?';
    await db.pool.execute(query, [id]);
  }
};

module.exports = User;