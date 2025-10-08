const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// 🔧 ENDPOINT PARA INICIALIZAR/RECREAR BD EN RAILWAY
router.get('/recreate-tables', async (req, res) => {
  try {
    console.log('🚀 Recreando tablas en Railway...');
    
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

      // ⚠️ ELIMINAR TABLAS EXISTENTES (CUIDADO: BORRA TODOS LOS DATOS)
      console.log('🗑️  Eliminando tablas existentes...');
      const dropTablesSQL = `
        DROP TABLE IF EXISTS login_logs;
        DROP TABLE IF EXISTS users;
      `;
      await connection.query(dropTablesSQL);
      console.log('✅ Tablas eliminadas');

      // ✅ CREAR NUEVAS TABLAS CON MEJORAS DE SEGURIDAD
      console.log('🔨 Creando nuevas tablas...');
      const createTablesSQL = `
        -- Tabla de usuarios con roles y email cifrado
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email TEXT NOT NULL COMMENT 'Email cifrado con AES-256',
          password_hash VARCHAR(255) NOT NULL COMMENT 'Password hasheado con bcrypt',
          name VARCHAR(255),
          role ENUM('user', 'admin', 'moderator') DEFAULT 'user' NOT NULL COMMENT 'Rol para control de acceso',
          last_login TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        -- Tabla de logs de inicio de sesión
        CREATE TABLE IF NOT EXISTS login_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          ip VARCHAR(45) NOT NULL COMMENT 'Dirección IP del cliente',
          user_agent TEXT COMMENT 'User-Agent del navegador',
          code VARCHAR(8) NULL COMMENT 'Código MFA de 8 caracteres alfanuméricos',
          success BOOLEAN DEFAULT FALSE COMMENT 'TRUE cuando MFA es verificado correctamente',
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Inicio de sesión',
          ended_at TIMESTAMP NULL COMMENT 'Fin de sesión (logout o expiración)',
          duration INT DEFAULT NULL COMMENT 'Duración de la sesión en segundos',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_started_at (started_at),
          INDEX idx_success (success)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      
      await connection.query(createTablesSQL);
      console.log('✅ Tablas creadas exitosamente');

      // Verificar que las tablas existen
      const [tables] = await connection.query('SHOW TABLES');
      console.log('📊 Tablas en la base de datos:', tables);

      // Verificar estructura de la tabla users
      const [usersCols] = await connection.query('DESCRIBE users');
      console.log('📋 Estructura de tabla users:', usersCols);

      res.json({ 
        success: true, 
        message: '✅ Base de datos recreada exitosamente con mejoras de seguridad',
        changes: [
          'Email cambiado a TEXT (para cifrado AES-256)',
          'Agregada columna role (user/admin/moderator)',
          'Agregado índice idx_success en login_logs',
          'Mejorados comentarios y charset utf8mb4'
        ],
        tables: tables,
        userStructure: usersCols,
        timestamp: new Date().toISOString()
      });

    } catch (dbError) {
      console.error('❌ Error en DB:', dbError);
      res.status(500).json({ 
        success: false, 
        error: dbError.message,
        code: dbError.code,
        sqlState: dbError.sqlState,
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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// 🔧 ENDPOINT PARA MIGRAR SIN ELIMINAR DATOS (si ya tienes usuarios)
router.get('/migrate-tables', async (req, res) => {
  try {
    console.log('🔄 Migrando tablas existentes...');
    
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
    };

    let connection;
    
    try {
      connection = await mysql.createConnection(config);
      console.log('✅ Conexión exitosa a Railway MySQL');

      // Migración sin perder datos
      const migrationSQL = `
        -- Verificar y agregar columna role
        SET @col_exists = 0;
        SELECT COUNT(*) INTO @col_exists 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'role';
        
        SET @query = IF(@col_exists = 0,
          'ALTER TABLE users ADD COLUMN role ENUM("user", "admin", "moderator") DEFAULT "user" NOT NULL AFTER name',
          'SELECT "Columna role ya existe" AS resultado'
        );
        PREPARE stmt FROM @query;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        -- Modificar email a TEXT
        ALTER TABLE users MODIFY COLUMN email TEXT NOT NULL COMMENT 'Email cifrado con AES-256';

        -- Agregar índice en login_logs si no existe
        CREATE INDEX IF NOT EXISTS idx_success ON login_logs(success);
      `;
      
      await connection.query(migrationSQL);
      console.log('✅ Migración completada');

      const [usersCols] = await connection.query('DESCRIBE users');

      res.json({ 
        success: true, 
        message: '✅ Migración completada sin perder datos',
        note: '⚠️  Los emails existentes aún están sin cifrar. Deberás cifrarlos manualmente o recrear usuarios.',
        userStructure: usersCols,
        timestamp: new Date().toISOString()
      });

    } catch (dbError) {
      console.error('❌ Error en migración:', dbError);
      res.status(500).json({ 
        success: false, 
        error: dbError.message,
        code: dbError.code,
        timestamp: new Date().toISOString()
      });
    } finally {
      if (connection) {
        await connection.end();
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

// 📊 ENDPOINT PARA VERIFICAR ESTADO DE LAS TABLAS
router.get('/check-tables', async (req, res) => {
  try {
    const config = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false,
      },
    };

    const connection = await mysql.createConnection(config);
    
    const [tables] = await connection.query('SHOW TABLES');
    const [usersCols] = await connection.query('DESCRIBE users');
    const [logsCols] = await connection.query('DESCRIBE login_logs');
    const [usersCount] = await connection.query('SELECT COUNT(*) as total FROM users');
    
    await connection.end();

    res.json({ 
      success: true,
      tables: tables,
      users_structure: usersCols,
      login_logs_structure: logsCols,
      users_count: usersCount[0].total,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;