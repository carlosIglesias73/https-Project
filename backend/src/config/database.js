// src/config/database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auth_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000 // Usar connectTimeout en lugar de timeout
});

// Probar conexión
pool.getConnection()
  .then(connection => {
    console.log('✅ Pool de MySQL creado correctamente');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error al crear pool de MySQL:', err.message);
  });

// ✅ Exportar el pool directamente (no como objeto con .pool)
module.exports = pool;