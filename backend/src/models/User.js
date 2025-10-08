// src/models/User.js
const db = require('../config/database');
const encryptionService = require('../services/encryptionService');

const User = {
  /**
   * Crear un nuevo usuario (email cifrado)
   */
  create: async ({ email, passwordHash, name }) => {
    // ✅ Cifrar email antes de guardarlo
    const encryptedEmail = encryptionService.encrypt(email);
    
    const query = 'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)';
    const [result] = await db.pool.execute(query, [encryptedEmail, passwordHash, name]);
    return result.insertId;
  },

  /**
   * Buscar usuario por email (requiere descifrar todos los emails)
   * NOTA: En producción real, deberías usar un hash del email como índice
   */
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users';
    const [rows] = await db.pool.execute(query);
    
    // Buscar descifrando cada email
    for (const row of rows) {
      try {
        const decryptedEmail = encryptionService.decrypt(row.email);
        if (decryptedEmail === email) {
          return {
            ...row,
            email: decryptedEmail // Retornar email descifrado
          };
        }
      } catch (error) {
        console.error('Error al descifrar email:', error);
      }
    }
    
    return null;
  },

  /**
   * Buscar usuario por ID
   */
  findById: async (id) => {
    const query = 'SELECT id, email, name, last_login, created_at FROM users WHERE id = ?';
    const [rows] = await db.pool.execute(query, [id]);
    
    if (rows[0]) {
      // ✅ Descifrar email antes de retornar
      rows[0].email = encryptionService.decrypt(rows[0].email);
    }
    
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