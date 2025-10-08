const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 🔧 ENDPOINT TEMPORAL PARA INICIALIZAR DB EN RAILWAY
router.get('/run-init-db', async (req, res) => {
  try {
    console.log('🚀 Ejecutando inicialización de DB en Railway...');
    
    const config = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
      ssl: {
        rejectUnauthorized: false,
      },
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
    };

    let connection;
    
    try {
      console.log('🔌 Conectando a MySQL en Railway...');
      connection = await mysql.createConnection(config);
      console.log('✅ Conexión exitosa a Railway MySQL');

      // Crear tablas directamente (sin usar schema.sql)
      const createTablesSQL = `
        -- Tabla de usuarios
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          last_login TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email)
        );

        -- Tabla de logs de inicio de sesión
        CREATE TABLE IF NOT EXISTS login_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          ip VARCHAR(45) NOT NULL,
          user_agent TEXT,
          code VARCHAR(8) NULL COMMENT 'Código MFA de 8 caracteres',
          success BOOLEAN DEFAULT FALSE COMMENT 'TRUE cuando MFA es verificado',
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP NULL,
          duration INT DEFAULT NULL COMMENT 'Duración de la sesión en segundos',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_started_at (started_at)
        );

        -- Insertar usuario de prueba
        INSERT IGNORE INTO users (email, password_hash, name) 
        VALUES ('test@example.com', '$2b$10$ExampleHashForTesting', 'Usuario Test');
      `;
      
      await connection.query(createTablesSQL);
      console.log('✅ Tablas creadas exitosamente');

      // Verificar que las tablas existen
      const [tables] = await connection.query('SHOW TABLES');
      console.log('📊 Tablas en la base de datos:', tables);

      res.json({ 
        success: true, 
        message: 'Base de datos inicializada exitosamente en Railway',
        tables: tables,
        timestamp: new Date().toISOString()
      });

    } catch (dbError) {
      console.error('❌ Error en DB:', dbError);
      res.status(500).json({ 
        success: false, 
        error: dbError.message,
        code: dbError.code,
        timestamp: new Date().toISOString()
      });
    } finally {
      if (connection) {
        await connection.end();
        console.log('🔌 Conexión cerrada');
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;