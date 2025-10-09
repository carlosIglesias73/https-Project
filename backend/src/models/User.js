// src/models/User.js
const db = require('../config/database');
const encryptionService = require('../services/encryptionService');

const User = {
  /**
   * Crear un nuevo usuario (email cifrado)
   */
  create: async ({ email, passwordHash, name }) => {
    try {
      // ✅ Cifrar email antes de guardarlo
      const encryptedEmail = encryptionService.encrypt(email);
      
      const query = 'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)';
      const [result] = await db.execute(query, [encryptedEmail, passwordHash, name]);
      return result.insertId;
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  },

  /**
   * Buscar usuario por email (requiere descifrar todos los emails)
   * NOTA: En producción real, deberías usar un hash del email como índice
   */
  findByEmail: async (email) => {
    try {
      const query = 'SELECT * FROM users';
      const [rows] = await db.execute(query);
      
      console.log(`🔍 Buscando email: ${email} entre ${rows.length} usuarios`);
      
      // Buscar descifrando cada email
      for (const row of rows) {
        try {
          const decryptedEmail = encryptionService.decrypt(row.email);
          if (decryptedEmail === email) {
            console.log('✅ Usuario encontrado:', decryptedEmail);
            return {
              ...row,
              email: decryptedEmail // Retornar email descifrado
            };
          }
        } catch (error) {
          console.error('Error al descifrar email de usuario:', row.id, error.message);
        }
      }
      
      console.log('❌ Usuario no encontrado con ese email');
      return null;
    } catch (error) {
      console.error('Error en findByEmail:', error);
      throw error;
    }
  },

  /**
   * Buscar usuario por ID
   */
  findById: async (id) => {
    try {
      const query = 'SELECT id, email, name, last_login, created_at FROM users WHERE id = ?';
      const [rows] = await db.execute(query, [id]);
      
      if (rows[0]) {
        // ✅ Descifrar email antes de retornar
        try {
          rows[0].email = encryptionService.decrypt(rows[0].email);
        } catch (error) {
          console.error('Error al descifrar email:', error);
          rows[0].email = '[Email cifrado - error al descifrar]';
        }
      }
      
      return rows[0];
    } catch (error) {
      console.error('Error en findById:', error);
      throw error;
    }
  },

  /**
   * Actualizar última fecha de login
   */
  updateLastLogin: async (id) => {
    try {
      const query = 'UPDATE users SET last_login = NOW() WHERE id = ?';
      await db.execute(query, [id]);
      return true;
    } catch (error) {
      console.error('Error actualizando último login:', error);
      throw error;
    }
  }
};

module.exports = User;