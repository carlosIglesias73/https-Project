// src/services/encryptionService.js
const crypto = require('crypto');

// Clave de cifrado de 32 bytes (debe estar en .env)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16; // Para AES, el IV es siempre 16 bytes

const encryptionService = {
  /**
   * Cifrar texto usando AES-256-CBC
   * @param {string} text - Texto a cifrar
   * @returns {string} - Texto cifrado en formato "iv:encryptedData"
   */
  encrypt: (text) => {
    if (!text) return null;
    
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32),
        iv
      );
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Retornar IV + datos cifrados separados por ':'
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Error al cifrar:', error);
      throw new Error('Error en cifrado de datos');
    }
  },

  /**
   * Descifrar texto usando AES-256-CBC
   * @param {string} encryptedText - Texto cifrado en formato "iv:encryptedData"
   * @returns {string} - Texto descifrado
   */
  decrypt: (encryptedText) => {
    if (!encryptedText) return null;
    
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) {
        throw new Error('Formato de datos cifrados inválido');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedData = parts[1];
      
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32),
        iv
      );
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error al descifrar:', error);
      throw new Error('Error en descifrado de datos');
    }
  },

  /**
   * Generar una clave de cifrado segura (ejecutar una vez)
   */
  generateKey: () => {
    return crypto.randomBytes(32).toString('hex');
  }
};

// Verificar que existe clave de cifrado
if (!process.env.ENCRYPTION_KEY) {
  console.warn('⚠️  ENCRYPTION_KEY no está configurada en .env');
  console.warn('🔑 Genera una con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

module.exports = encryptionService;